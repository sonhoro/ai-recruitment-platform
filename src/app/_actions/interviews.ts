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

export async function getRecruiters(): Promise<{ id: string; full_name: string }[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('recruiters')
    .select('id, full_name')
    .order('full_name', { ascending: true });
  return data ?? [];
}
