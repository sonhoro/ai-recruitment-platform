'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from './auth';

export async function updateProfile(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { error: 'No autorizado.' };

  const phone       = formData.get('phone')?.toString().trim() || null;
  const linkedinUrl = formData.get('linkedin_url')?.toString().trim() || null;
  const portfolioUrl = formData.get('portfolio_url')?.toString().trim() || null;

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('candidates')
    .select('id')
    .eq('email', ctx.email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from('candidates')
      .update({ phone, linkedin_url: linkedinUrl, portfolio_url: portfolioUrl })
      .eq('id', existing.id);

    if (error) return { error: 'Error al actualizar el perfil.' };
  } else {
    const { error } = await admin
      .from('candidates')
      .insert({
        email: ctx.email,
        full_name: ctx.email.split('@')[0],
        phone,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        status: 'new',
        source: 'registration',
      });

    if (error) return { error: 'Error al crear el perfil.' };
  }

  revalidatePath('/candidate');
  return { success: true };
}

export async function changePassword(
  _prev: unknown,
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { error: 'No autorizado.' };

  const currentPassword = formData.get('current_password')?.toString();
  const newPassword     = formData.get('new_password')?.toString();

  if (!currentPassword || !newPassword) {
    return { error: 'Ambos campos son requeridos.' };
  }

  if (newPassword.length < 6) {
    return { error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
  }

  // Verify current password
  const supabase = await createServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: ctx.email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: 'La contraseña actual es incorrecta.' };
  }

  // Update password via admin API
  const admin = createAdminClient();
  const { data: { user } } = await admin.auth.admin.getUserByEmail(ctx.email);
  if (!user) return { error: 'Usuario no encontrado.' };

  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (updateError) {
    return { error: 'Error al cambiar la contraseña.' };
  }

  return { success: true };
}
