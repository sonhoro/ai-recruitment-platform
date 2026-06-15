'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export type UpdateInterviewResult = {
  success: true;
} | {
  success: false;
  error: string;
}

export async function updateInterview(
  interviewId: string,
  data: {
    scheduled_at?: string;
    recruiter_id?: string;
    meeting_url?: string | null;
  },
): Promise<UpdateInterviewResult> {
  if (!interviewId || typeof interviewId !== 'string') {
    return { success: false, error: 'interviewId es requerido.' };
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'No autorizado.' };
  }

  const admin = createAdminClient();

  const updateData: Record<string, string> = {};
  if (data.scheduled_at) updateData.scheduled_at = data.scheduled_at;
  if (data.recruiter_id) updateData.recruiter_id = data.recruiter_id;
  if (data.meeting_url !== undefined) updateData.meeting_url = data.meeting_url ?? '';

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: 'No hay campos para actualizar.' };
  }

  const { error } = await admin
    .from('interviews')
    .update(updateData)
    .eq('id', interviewId);

  if (error) {
    console.error('[interviews] Update failed:', error);
    return { success: false, error: 'Error al actualizar la entrevista.' };
  }

  revalidatePath('/dashboard/interviews');
  return { success: true };
}

export async function completeInterview(
  interviewId: string,
  feedback?: string,
): Promise<UpdateInterviewResult> {
  if (!interviewId || typeof interviewId !== 'string') {
    return { success: false, error: 'interviewId es requerido.' };
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'No autorizado.' };
  }

  const admin = createAdminClient();

  const updateData: Record<string, string> = {
    status: 'completed',
    feedback_submitted_at: new Date().toISOString(),
  };
  if (feedback) updateData.feedback = feedback;

  const { error } = await admin
    .from('interviews')
    .update(updateData)
    .eq('id', interviewId);

  if (error) {
    console.error('[interviews] complete failed:', error);
    return { success: false, error: 'Error al completar la entrevista.' };
  }

  revalidatePath('/dashboard/interviews');
  return { success: true };
}

const INVITE_TIMEOUT_MS = 10_000;

export async function sendInterviewInvitation(data: {
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string;
  interviewer: string;
}): Promise<{ sent: true } | { sent: false; reason: string }> {
  const webhookUrl = process.env.N8N_INTERVIEW_INVITE_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn(
      '[interviews] N8N_INTERVIEW_INVITE_WEBHOOK_URL not set. ' +
        'Skipping invitation email.',
    );
    return { sent: false, reason: 'Webhook URL not configured' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), INVITE_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'interview_invitation',
        ...data,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('[interviews] Invitation webhook failed:', response.status, body.slice(0, 200));
      return { sent: false, reason: `n8n returned HTTP ${response.status}` };
    }

    return { sent: true };
  } catch (err) {
    clearTimeout(timeoutId);

    const reason =
      err instanceof Error && err.name === 'AbortError'
        ? 'Webhook timed out'
        : `Network error: ${err instanceof Error ? err.message : String(err)}`;

    console.error('[interviews] Invitation dispatch error:', reason);
    return { sent: false, reason };
  }
}

export async function getRecruiters(): Promise<{ id: string; full_name: string }[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('recruiters')
    .select('id, full_name')
    .order('full_name', { ascending: true });
  return data ?? [];
}
