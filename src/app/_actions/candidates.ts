'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { fireN8nWebhook } from '@/lib/n8n-webhook';
import { getCurrentUserContext } from './auth';

export async function applyToJob(
  jobId: string,
  customResumeUrl?: string,
): Promise<{ success: true; updated: boolean } | { error: string }> {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { error: 'No autorizado. Inicia sesión.' };

  let resumeUrl: string | undefined = customResumeUrl;
  let fullName: string | null = null;

  if (!resumeUrl) {
    const c = await cookies();
    resumeUrl = c.get('main_resume_url')?.value;

    if (!resumeUrl) {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      resumeUrl = user?.user_metadata?.main_resume_url as string | undefined;
      fullName = user?.user_metadata?.full_name as string | null ?? null;
    }
  }

  if (!resumeUrl) {
    return { error: 'No tienes un CV guardado. Sube uno primero desde "Subir CV".' };
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('candidates')
    .select('full_name')
    .eq('email', ctx.email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  fullName ??= existing?.full_name ?? ctx.email.split('@')[0];

  const { data: dup } = await admin
    .from('candidates')
    .select('id')
    .eq('email', ctx.email)
    .eq('job_id', jobId)
    .maybeSingle();

  let candidateId: string;
  let isUpdate = false;

  if (dup) {
    const { error: updateError } = await admin
      .from('candidates')
      .update({ resume_url: resumeUrl })
      .eq('id', dup.id);

    if (updateError) return { error: 'Error al actualizar la postulación.' };
    candidateId = dup.id;
    isUpdate = true;
  } else {
    const { data: inserted, error: insertError } = await admin
      .from('candidates')
      .insert({
        job_id: jobId,
        full_name: fullName,
        email: ctx.email,
        resume_url: resumeUrl,
        status: 'new',
        source: 'candidate_portal',
      })
      .select('id')
      .single();

    if (insertError) return { error: 'Error al crear la postulación.' };
    candidateId = inserted.id;
  }

  // Fire n8n webhook for AI analysis (best-effort)
  const webhookResult = await fireN8nWebhook({
    candidate_id: candidateId,
    job_id:       jobId,
    cv_url:       resumeUrl,
  });

  if (webhookResult.ok) {
    await admin
      .from('candidates')
      .update({ status: 'screening' })
      .eq('id', candidateId);
  }

  revalidatePath('/candidate/applications');
  return { success: true, updated: isUpdate };
}
