'use server';

import { redirect }         from 'next/navigation';
import { revalidatePath }   from 'next/cache';
import { cookies }          from 'next/headers';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

export type UserRole = 'recruiter' | 'interviewer' | 'candidate';

/**
 * Look up the platform platform role for a given auth user ID.
 * Checks user_metadata first (set during registration),
 * then recruiters table (recruiter | interviewer),
 * then candidates table (candidate).
 */
export async function getUserRole(authUserId: string): Promise<UserRole | null> {
  // 1. Check role stored in auth user_metadata (set during registration)
  try {
    const admin = createAdminClient();
    const { data: { user } } = await admin.auth.admin.getUserById(authUserId);

    const metadataRole = user?.user_metadata?.role as string | undefined;
    if (metadataRole === 'recruiter' || metadataRole === 'interviewer' || metadataRole === 'candidate') {
      return metadataRole;
    }
  } catch {
    // Admin client may fail — fall through
  }

  // 2. Check recruiters table (recruiter | interviewer)
  const supabase = await createServerClient();
  const { data: recruiter } = await supabase
    .from('recruiters')
    .select('role')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (recruiter) return recruiter.role as UserRole;

  // 3. Check candidates table
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (candidate) return 'candidate';

  return null;
}

/**
 * Check the user_role cookie for a cached role.
 * Used as a fast fallback before heavier lookups.
 */
function getCookieRole(): Promise<UserRole | null> {
  return cookies().then(c => {
    const role = c.get('user_role')?.value as UserRole | undefined;
    if (role === 'recruiter' || role === 'interviewer' || role === 'candidate') return role;
    return null;
  });
}

/**
 * Get current user context from Supabase session or dev bypass cookies.
 * Returns { email, role } on success, null if not found.
 */
export async function getCurrentUserContext(): Promise<{ email: string; role: UserRole } | null> {
  // 1. Fast path from cookies (set during registration / sign-in)
  const c = await cookies();
  const cookieEmail = c.get('user_email')?.value;
  const cookieRole  = c.get('user_role')?.value as UserRole | undefined;
  if (cookieEmail && cookieRole) return { email: cookieEmail, role: cookieRole };

  if (process.env.DEV_BYPASS_AUTH === 'true') {
    return null;
  }

  // 2. Supabase session
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const role = await getUserRole(user.id);
  if (!role) return null;

  return { email: user.email, role };
}

// ─────────────────────────────────────────────────────────────
// SIGN IN — redirects based on role
// ─────────────────────────────────────────────────────────────

export async function signIn(
  formData: FormData,
): Promise<{ success: boolean; error?: string; redirect?: string }> {
  try {
    const email    = formData.get('email')?.toString().trim();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
      return { success: false, error: 'Email y contraseña son requeridos.' };
    }

    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const role = email.includes('entrevist')
        ? 'interviewer'
        : email.includes('candidat') || email.includes('ana.garcia')
        ? 'candidate'
        : 'recruiter';

      const cookieStore = await cookies();
      cookieStore.set('user_role', role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8,
        path: '/',
      });
      cookieStore.set('user_email', email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8,
        path: '/',
      });

      revalidatePath('/');
      const redirectUrl = role === 'interviewer' ? '/interviewer' : role === 'candidate' ? '/candidate' : '/dashboard/jobs';
      return { success: true, redirect: redirectUrl };
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[auth] signIn error:', error.message);
      return {
        success: false,
        error:
          error.message === 'Invalid login credentials'
            ? 'Credenciales incorrectas. Verifica tu email y contraseña.'
            : 'Error al iniciar sesión. Intenta de nuevo.',
      };
    }

    if (!data.user) {
      return { success: false, error: 'Error al obtener los datos del usuario.' };
    }

    const role = await getUserRole(data.user.id);

    if (!role) {
      return {
        success: false,
        error: 'No tienes acceso a la plataforma. Contacta al administrador.',
      };
    }

    const cookieStore = await cookies();
    cookieStore.set('user_role', role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });
    cookieStore.set('user_email', email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });

    revalidatePath('/');

    const redirectUrl = role === 'interviewer' ? '/interviewer' : role === 'candidate' ? '/candidate' : '/dashboard/jobs';
    return { success: true, redirect: redirectUrl };
  } catch (err) {
    console.error('[auth] signIn unexpected error:', err);
    return { success: false, error: `Error inesperado: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ─────────────────────────────────────────────────────────────
// CANDIDATE REGISTER
// ─────────────────────────────────────────────────────────────

export interface RegisterResult {
  success: boolean;
  error?: string;
  redirect?: string;
}

export async function candidateRegister(
  formData: FormData,
): Promise<RegisterResult | never> {
  const email    = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();
  const fullName = formData.get('full_name')?.toString().trim();

  if (!email || !password || !fullName) {
    return { success: false, error: 'Todos los campos son requeridos.' };
  }

  if (password.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  const admin = createAdminClient();

  // Create auth user
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'candidate' },
  });

  if (error) {
    console.error('[auth] candidateRegister error:', JSON.stringify({ message: error.message, status: error.status, name: error.name }));
    return { success: false, error: `Error: ${error.message}` };
  }

  if (!data.user) {
    return { success: false, error: 'Error al crear el usuario.' };
  }

  // Create candidate record (or link existing one by email)
  const { data: existing } = await admin
    .from('candidates')
    .select('id')
    .eq('email', email)
    .is('job_id', null)
    .maybeSingle();

  if (existing) {
    await admin.from('candidates').update({ auth_user_id: data.user.id }).eq('id', existing.id);
  } else {
    await admin.from('candidates').insert({
      auth_user_id: data.user.id,
      full_name: fullName,
      email,
      status: 'new',
      source: 'registration',
      job_id: null,
    });
  }

  // Sign in so the user has a session immediately
  const anonClient = await createServerClient();
  await anonClient.auth.signInWithPassword({ email, password });

  // Set role + email cookies
  const cookieStore = await cookies();
  cookieStore.set('user_role', 'candidate', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  });
  cookieStore.set('user_email', email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  });

  revalidatePath('/candidate');
  return { success: true, redirect: '/candidate' };
}

// ─────────────────────────────────────────────────────────────
// SIGN OUT
// ─────────────────────────────────────────────────────────────

export async function signOut(): Promise<never> {
  if (process.env.DEV_BYPASS_AUTH !== 'true') {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
  }

  const cookieStore = await cookies();
  cookieStore.delete('user_role');

  revalidatePath('/login');
  redirect('/login');
}
