'use server';

import { redirect }         from 'next/navigation';
import { revalidatePath }   from 'next/cache';
import { cookies }          from 'next/headers';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

export type UserRole = 'recruiter' | 'interviewer' | 'candidate';

export interface SignInResult {
  success: false;
  error: string;
}

/**
 * Look up the platform role for a given auth user ID.
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
    // Admin client may fail (e.g. missing service role key) — fall through
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
 * Get current user context from Supabase session or dev bypass cookies.
 * Returns { email, role } on success, null if not found.
 */
export async function getCurrentUserContext(): Promise<{ email: string; role: UserRole } | null> {
  if (process.env.DEV_BYPASS_AUTH === 'true') {
    const c = await cookies();
    const email = c.get('user_email')?.value;
    const role  = c.get('user_role')?.value as UserRole | undefined;
    if (email && role) return { email, role };
    return null;
  }

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
): Promise<SignInResult | never> {
  const email    = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return { success: false, error: 'Email y contraseña son requeridos.' };
  }

  // ── Dev bypass: infer role from email, skip Supabase ──────
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
    if (role === 'interviewer') redirect('/interviewer');
    if (role === 'candidate') redirect('/candidate');
    redirect('/dashboard/jobs');
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

  revalidatePath('/');

  if (role === 'interviewer') redirect('/interviewer');
  if (role === 'candidate') redirect('/candidate');
  redirect('/dashboard/jobs');
}

// ─────────────────────────────────────────────────────────────
// CANDIDATE REGISTER
// ─────────────────────────────────────────────────────────────

export interface RegisterResult {
  success: boolean;
  error?: string;
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

  // Link to candidate record if one exists with this email (e.g. from seed data)
  const { error: updateError } = await admin
    .from('candidates')
    .update({ auth_user_id: data.user.id })
    .eq('email', email);

  if (updateError) {
    console.error('[auth] candidate link error:', updateError.message);
  }

  // Set role cookie
  const cookieStore = await cookies();
  cookieStore.set('user_role', 'candidate', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  });

  revalidatePath('/candidate');
  redirect('/candidate');
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
