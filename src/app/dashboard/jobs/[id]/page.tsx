/**
 * src/app/dashboard/jobs/[id]/page.tsx
 *
 * Job Detail Page — Candidate Ranking View
 * Fetches real data from Supabase using `params.id`.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import type { CandidateStatus } from '@/types/database.types';
import type { CandidateWithScore } from './_data/mock';
import RankingList from './_components/RankingList';

// ─────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title:       'Candidatos | AI Recruitment Platform',
  description: 'Ranking de candidatos evaluados por IA para esta vacante.',
};

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────
// Page — Server Component
// ─────────────────────────────────────────────────────────────

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  // ── 1. Fetch job ──────────────────────────────────────────
  const { data: jobRow } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (!jobRow) {
    return (
      <div className="px-6 py-8 sm:px-10 min-h-full">
        <nav className="mb-7">
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-400 transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Volver a Vacantes
          </Link>
        </nav>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-slate-500 text-sm">Vacante no encontrada.</p>
        </div>
      </div>
    );
  }

  const job = {
    id:            jobRow.id,
    title:         jobRow.title,
    department:    jobRow.department ?? '',
    location:      jobRow.location ?? '',
    remote_policy: jobRow.remote_policy ?? '',
    status:        jobRow.status,
    published_at:  jobRow.published_at ?? jobRow.created_at,
  };

  // ── 2. Fetch candidates + scores ──────────────────────────
  const { data: candidateRows } = await supabase
    .from('candidates')
    .select('*')
    .eq('job_id', id)
    .order('created_at', { ascending: false });

  const candidateIds = (candidateRows ?? []).map((c) => c.id);

  const { data: scoreRows } = candidateIds.length > 0
    ? await supabase
        .from('scores')
        .select('*')
        .in('candidate_id', candidateIds)
        .eq('stage', 'overall')
        .order('evaluated_at', { ascending: false })
    : { data: [] };

  const scoreByCandidate = new Map();
  for (const s of scoreRows ?? []) {
    if (!scoreByCandidate.has(s.candidate_id)) {
      scoreByCandidate.set(s.candidate_id, s);
    }
  }

  const candidates: CandidateWithScore[] = (candidateRows ?? []).map((c) => {
    const sc = scoreByCandidate.get(c.id);
    return {
      id:                c.id,
      job_id:            c.job_id,
      full_name:         c.full_name,
      email:             c.email,
      phone:             c.phone,
      resume_url:        c.resume_url,
      status:            c.status as CandidateStatus,
      source:            c.source ?? '',
      applied_at:        c.applied_at,
      score_id:          sc?.id ?? '',
      score:             sc?.score ?? 0,
      stage:             'overall',
      reasoning:         sc?.reasoning ?? '',
      strengths:         (sc?.strengths as string[]) ?? [],
      weaknesses:        (sc?.weaknesses as string[]) ?? [],
      model_version:     sc?.model_version ?? '',
      prompt_tokens:     sc?.prompt_tokens ?? 0,
      completion_tokens: sc?.completion_tokens ?? 0,
      latency_ms:        sc?.latency_ms ?? 0,
      seniority:          (c.seniority ?? 'Semi-Senior') as any,
      current_role:       '',
      years_experience:   0,
      skills:             [],
      ai_summary:         c.ai_summary ?? '',
      location:           c.location ?? '',
      ai_recommendation:  c.ai_recommendation ?? null,
    };
  });

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);

  return (
    <div className="px-6 py-8 sm:px-10 min-h-full">

      {/* ── Breadcrumb ──────────────────────────────────── */}
      <nav className="mb-7" aria-label="Breadcrumb">
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-400 transition-colors"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Volver a Vacantes
        </Link>
      </nav>

      {/* ── Main ranking view ───────────────────────────── */}
      <RankingList job={job} candidates={candidates} />
    </div>
  );
}
