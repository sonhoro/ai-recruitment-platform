'use server';

/**
 * src/app/_actions/stages.ts
 *
 * Server Actions for the "Human-in-the-loop" pipeline stage management.
 *
 * When a recruiter changes a candidate's stage in the UI (StageDropdown),
 * this module:
 *   1. Verifies the recruiter's session.
 *   2. Validates that the requested transition is legal.
 *   3. Updates `candidates.status` in Supabase.
 *   4. Dispatches a structured notification to n8n
 *      (`N8N_NOTIFICATIONS_WEBHOOK_URL`) so n8n can:
 *        • Send a confirmation/rejection email to the candidate.
 *        • Create a Google Calendar invite (for interview transitions).
 *   5. Revalidates the relevant dashboard pages.
 *
 * Exports:
 *   updateCandidateStage(candidateId, newStatus) → StageUpdateResult
 */

import { revalidatePath } from 'next/cache';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import {
  dispatchStageChangeNotification,
  type NotificationResult,
} from '@/lib/notifications';
import type { CandidateStatus } from '@/types/database.types';

// ─────────────────────────────────────────────────────────────────────────────
// Stage transition rules
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Allowed CandidateStatus transitions.
 *
 * Rules:
 *   • Terminal states ('hired', 'rejected', 'withdrawn') have no outbound edges.
 *     A candidate cannot be "un-rejected" via the UI — requires a DB admin action.
 *   • A recruiter can always move any active candidate to a terminal state.
 *   • Forward-only flow is enforced except for the 'interview' → 'screening'
 *     rollback (recruiter changed their mind).
 *
 * Exported so the StageDropdown UI can filter options based on current status.
 */
const STAGE_TRANSITIONS: Readonly<Record<CandidateStatus, CandidateStatus[]>> = {
  new:       ['screening', 'interview', 'rejected', 'withdrawn'],
  screening: ['interview', 'offer',     'rejected', 'withdrawn'],
  interview: ['offer',     'screening', 'rejected', 'withdrawn'],
  offer:     ['hired',     'rejected',  'withdrawn'],
  hired:     [],                                                  // terminal
  rejected:  [],                                                  // terminal
  withdrawn: [],                                                  // terminal
} as const;

/** Returns true if moving from `from` → `to` is a legal transition. */
function isValidTransition(from: CandidateStatus, to: CandidateStatus): boolean {
  return (STAGE_TRANSITIONS[from] as readonly string[]).includes(to);
}

// ─────────────────────────────────────────────────────────────────────────────
// Return types
// ─────────────────────────────────────────────────────────────────────────────

export interface StageUpdateSuccess {
  success:          true;
  candidate: {
    id:             string;
    full_name:      string;
    email:          string;
    previous_status: CandidateStatus;
    new_status:     CandidateStatus;
    job_id:         string;
    job_title:      string;
  };
  notification:     NotificationResult;
}

export interface StageUpdateFailure {
  success: false;
  error:   string;
}

export type StageUpdateResult = StageUpdateSuccess | StageUpdateFailure;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Validates that a string is a known CandidateStatus value. */
const VALID_STATUSES = new Set<CandidateStatus>([
  'new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn',
]);

function isCandidateStatus(value: unknown): value is CandidateStatus {
  return typeof value === 'string' && VALID_STATUSES.has(value as CandidateStatus);
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER ACTION: updateCandidateStage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates a candidate's pipeline stage and fires a notification webhook.
 *
 * Called from the StageDropdown component via `startTransition`.
 *
 * @param candidateId  UUID of the candidate to update.
 * @param newStatus    The target CandidateStatus value.
 * @returns            StageUpdateResult — discriminated union.
 *
 * @example
 * // In a Client Component:
 * const [isPending, startTransition] = useTransition();
 *
 * function handleStageChange(candidateId: string, newStatus: CandidateStatus) {
 *   startTransition(async () => {
 *     const result = await updateCandidateStage(candidateId, newStatus);
 *     if (!result.success) showError(result.error);
 *   });
 * }
 */
export async function updateCandidateStage(
  candidateId: string,
  newStatus:   CandidateStatus,
): Promise<StageUpdateResult> {

  // ── 1. Input sanity checks ────────────────────────────────────────────────

  if (!candidateId || typeof candidateId !== 'string') {
    return { success: false, error: 'candidateId es requerido.' };
  }

  if (!isCandidateStatus(newStatus)) {
    return {
      success: false,
      error:   `Estado inválido: "${newStatus}". Valores permitidos: ${[...VALID_STATUSES].join(', ')}.`,
    };
  }

  // ── 2. Verify recruiter session ───────────────────────────────────────────

  const supabase = await createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error:   'No autorizado. Por favor inicia sesión.',
    };
  }

  // ── 3. Fetch the candidate + job info in a single query ───────────────────
  //
  // We need:
  //   • candidate.status  → validate the transition + notification payload
  //   • candidate.email   → notification payload
  //   • candidate.full_name → notification payload
  //   • job.id / job.title  → revalidatePath + notification payload
  //
  // The admin client is used here so the query works with RLS disabled
  // and regardless of the recruiter's auth state on this row.

  const adminSupabase = createAdminClient();

  const { data: candidateRow, error: fetchError } = await adminSupabase
    .from('candidates')
    .select(`
      id,
      full_name,
      email,
      status,
      job_id,
      jobs ( title )
    `)
    .eq('id', candidateId)
    .single();

  if (fetchError || !candidateRow) {
    console.error('[stages] Candidate lookup failed:', fetchError);
    return {
      success: false,
      error:   'Candidato no encontrado o error al leerlo de la base de datos.',
    };
  }

  const previousStatus = candidateRow.status as CandidateStatus;

  // ── 4. Guard: no-op transition ────────────────────────────────────────────

  if (previousStatus === newStatus) {
    return {
      success: false,
      error:   `El candidato ya se encuentra en la etapa "${newStatus}".`,
    };
  }

  // ── 5. Guard: illegal transition ──────────────────────────────────────────

  if (!isValidTransition(previousStatus, newStatus)) {
    const allowed = STAGE_TRANSITIONS[previousStatus];
    return {
      success: false,
      error:
        allowed.length === 0
          ? `La etapa "${previousStatus}" es un estado terminal. No se puede cambiar.`
          : `Transición inválida: "${previousStatus}" → "${newStatus}". ` +
            `Etapas permitidas desde "${previousStatus}": ${allowed.join(', ')}.`,
    };
  }

  // ── 6. UPDATE candidates.status ───────────────────────────────────────────

  const { data: updatedCandidate, error: updateError } = await adminSupabase
    .from('candidates')
    .update({ status: newStatus })
    .eq('id', candidateId)
    .select('id, full_name, email, status, job_id')
    .single();

  if (updateError || !updatedCandidate) {
    console.error('[stages] Status update failed:', updateError);
    return {
      success: false,
      error:   'Error al actualizar el estado del candidato. Intenta de nuevo.',
    };
  }

  // ── 7. Derive job title (embedded join result) ────────────────────────────

  // PostgREST returns the joined row as an object or array depending on FK direction
  const jobsRelation = candidateRow.jobs as { title: string } | { title: string }[] | null;
  const jobTitle = Array.isArray(jobsRelation)
    ? (jobsRelation[0]?.title ?? 'Vacante')
    : (jobsRelation?.title ?? 'Vacante');

  // ── 8. Create interview record if status changed to 'interview' ──────────

  if (newStatus === 'interview') {
    const { data: recruiter } = await adminSupabase
      .from('recruiters')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (recruiter) {
      const defaultScheduledAt = new Date();
      defaultScheduledAt.setDate(defaultScheduledAt.getDate() + 7);

      const { error: interviewError } = await adminSupabase
        .from('interviews')
        .insert({
          candidate_id:    candidateId,
          job_id:          candidateRow.job_id,
          recruiter_id:    recruiter.id,
          scheduled_at:    defaultScheduledAt.toISOString(),
          interview_type:  'phone_screen',
          status:          'scheduled',
          duration_minutes: 60,
          timezone:        'UTC',
        });

      if (interviewError) {
        console.warn(
          `[stages] Interview record not created for candidate ${candidateId}:`,
          interviewError.message,
        );
      }
    } else {
      console.warn(
        `[stages] Recruiter not found for auth user ${user.id} — interview not created.`,
      );
    }
  }

  // ── 9. Revalidate cached pages ────────────────────────────────────────────

  revalidatePath('/dashboard/jobs');
  revalidatePath(`/dashboard/jobs/${candidateRow.job_id}`);
  revalidatePath('/dashboard/interviews');

  // ── 10. Dispatch notification webhook to n8n ───────────────────────────────
  //
  // Runs AFTER the DB update so a webhook failure never blocks stage promotion.
  // If dispatch fails, the candidate's status is already updated in the DB.

  const notificationResult = await dispatchStageChangeNotification({
    candidate_id:    updatedCandidate.id,
    candidate_name:  updatedCandidate.full_name,
    candidate_email: updatedCandidate.email,
    previous_status: previousStatus,
    new_status:      newStatus,
    job_id:          updatedCandidate.job_id,
    job_title:       jobTitle,
    changed_at:      new Date().toISOString(),
  });

  if (!notificationResult.dispatched) {
    // Non-fatal — log and continue. The recruiter's action succeeded.
    console.warn(
      `[stages] Notification not dispatched for candidate ${candidateId}:`,
      notificationResult.reason,
    );
  }

  // ── 11. Return ─────────────────────────────────────────────────────────────

  return {
    success: true,
    candidate: {
      id:              updatedCandidate.id,
      full_name:       updatedCandidate.full_name,
      email:           updatedCandidate.email,
      previous_status: previousStatus,
      new_status:      newStatus,
      job_id:          updatedCandidate.job_id,
      job_title:       jobTitle,
    },
    notification: notificationResult,
  };
}
