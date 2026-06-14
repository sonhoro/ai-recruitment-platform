'use server';

/**
 * src/app/_actions/jobs.ts
 *
 * Server Actions for Job (Vacancy) management.
 *
 * Functions:
 *   - createJob(formData)  → INSERT a new job, revalidate /dashboard/jobs
 *   - getJobs()            → SELECT all non-archived jobs with candidate count
 *
 * Both functions return a typed discriminated-union result so callers can
 * pattern-match on `result.success` without relying on thrown exceptions.
 */

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import type { JobInsert, JobRow } from '@/types/database.types';

// ─────────────────────────────────────────────────────────────
// Shared result type
// ─────────────────────────────────────────────────────────────

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─────────────────────────────────────────────────────────────
// JobWithCount — JobRow enriched with the live candidate count
// ─────────────────────────────────────────────────────────────

export type JobWithCount = JobRow & {
  /** Total candidates who have applied to this job. */
  candidate_count: number;
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Extract a non-empty string from FormData, or return null. */
function getString(fd: FormData, key: string): string | null {
  const value = fd.get(key)?.toString().trim();
  return value && value.length > 0 ? value : null;
}

// ─────────────────────────────────────────────────────────────
// ACTION: createJob
// ─────────────────────────────────────────────────────────────

/**
 * Creates a new job (vacancy) in the database.
 *
 * Expected FormData fields:
 *   title            (required)
 *   description      (optional)
 *   requirements     (optional)
 *   department       (optional)
 *   location         (optional)
 *   employment_type  (optional) — 'full_time' | 'part_time' | 'contract'
 *   remote_policy    (optional) — 'remote' | 'hybrid' | 'onsite'
 *
 * On success: revalidates /dashboard/jobs and returns the created JobRow.
 */
export async function createJob(
  formData: FormData,
): Promise<ActionResult<JobRow>> {
  const supabase = await createServerClient();

  // ── 1. Verify session ──────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: 'No autorizado. Por favor inicia sesión.',
    };
  }

  // ── 2. Resolve recruiter profile ───────────────────────────
  const { data: recruiter, error: recruiterError } = await supabase
    .from('recruiters')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (recruiterError) {
    console.error('[createJob] recruiter lookup error:', recruiterError);
    return {
      success: false,
      error: 'Error al verificar el perfil del reclutador.',
    };
  }

  if (!recruiter) {
    return {
      success: false,
      error:
        'Perfil de reclutador no encontrado. Completa tu perfil primero.',
    };
  }

  // ── 3. Extract + validate fields ───────────────────────────
  const title = getString(formData, 'title');

  if (!title) {
    return {
      success: false,
      error: 'El título de la vacante es obligatorio.',
    };
  }

  const skillsRaw = formData.get('skills_required')?.toString().trim() || '';
  const skills_required = skillsRaw
    ? skillsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : null;

  const payload: JobInsert = {
    recruiter_id: recruiter.id,
    title,
    description: getString(formData, 'description'),
    requirements: getString(formData, 'requirements'),
    department: getString(formData, 'department'),
    location: getString(formData, 'location'),
    employment_type: getString(formData, 'employment_type'),
    remote_policy: getString(formData, 'remote_policy'),
    skills_required,
    status: 'open',
    published_at: new Date().toISOString(),
  };

  // ── 4. Insert ───────────────────────────────────────────────
  const { data, error: insertError } = await supabase
    .from('jobs')
    .insert(payload)
    .select()
    .single();

  if (insertError) {
    console.error('[createJob] insert error:', insertError);
    return {
      success: false,
      error: 'Error al crear la vacante. Intenta de nuevo.',
    };
  }

  // ── 5. Revalidate page cache ────────────────────────────────
  revalidatePath('/dashboard/jobs');

  return { success: true, data };
}

// ─────────────────────────────────────────────────────────────
// ACTION: getJobs
// ─────────────────────────────────────────────────────────────

/**
 * Returns all non-archived jobs belonging to the authenticated recruiter,
 * ordered by most recently created, with a live candidate count per job.
 *
 * The count is derived from the embedded `candidates` relation using
 * Supabase's PostgREST aggregation syntax: `candidates(count)`.
 */
export async function getJobs(): Promise<ActionResult<JobWithCount[]>> {
  const supabase = await createServerClient();

  // Verify session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: 'No autorizado.',
    };
  }

  // Resolve recruiter
  const { data: recruiter } = await supabase
    .from('recruiters')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!recruiter) {
    // Return empty list — recruiter profile not yet created
    return { success: true, data: [] };
  }

  // Fetch jobs with embedded candidate count
  const { data, error } = await supabase
    .from('jobs')
    .select(
      `
      *,
      candidates(count)
    `,
    )
    .eq('recruiter_id', recruiter.id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getJobs] select error:', error);
    return { success: false, error: 'Error al obtener las vacantes.' };
  }

  // PostgREST returns count as: [{ count: number }]
  // Normalize to a plain `candidate_count` number.
  const jobs: JobWithCount[] = (data ?? []).map((job) => {
    const countArr = job.candidates as unknown as Array<{ count: number }>;
    return {
      ...job,
      candidates: undefined, // remove raw array from shape
      candidate_count: countArr?.[0]?.count ?? 0,
    } as JobWithCount;
  });

  return { success: true, data: jobs };
}
