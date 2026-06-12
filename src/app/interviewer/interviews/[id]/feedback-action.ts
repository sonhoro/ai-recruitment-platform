'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';

export type FeedbackResult = { success: false; error: string } | { success: true };

export async function submitFeedback(
  interviewId: string,
  formData: FormData,
): Promise<FeedbackResult> {
  const rating   = Number(formData.get('rating'));
  const outcome  = formData.get('outcome')?.toString();
  const feedback = formData.get('feedback')?.toString().trim();

  if (!rating || rating < 1 || rating > 5) {
    return { success: false, error: 'La calificación debe ser entre 1 y 5.' };
  }
  if (!outcome || !['pass', 'fail', 'pending'].includes(outcome)) {
    return { success: false, error: 'Selecciona un resultado válido.' };
  }
  if (!feedback || feedback.length < 10) {
    return { success: false, error: 'El feedback debe tener al menos 10 caracteres.' };
  }

  const supabase = await createServerClient();

  const { error } = await supabase
    .from('interviews')
    .update({
      rating,
      outcome,
      feedback,
      feedback_submitted_at: new Date().toISOString(),
      status: 'completed',
    })
    .eq('id', interviewId);

  if (error) {
    console.error('[feedback] update error:', error.message);
    return { success: false, error: 'Error al guardar el feedback.' };
  }

  revalidatePath(`/interviewer/interviews/${interviewId}`);
  redirect(`/interviewer/interviews/${interviewId}`);
}
