/**
 * src/app/dashboard/candidates/page.tsx
 * Server Component — fetches real data from Supabase, renders CandidatesClient.
 */

import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import CandidatesClient from './_components/CandidatesClient'

export const metadata: Metadata = {
  title: 'Candidatos | AI Recruitment Platform',
  description: 'Vista global de todos los candidatos activos en el pipeline de reclutamiento.',
}

export const dynamic = 'force-dynamic'

export default async function CandidatesPage() {
  const supabase = await createServerClient()

  const { data: candidates } = await supabase
    .from('candidates')
    .select(`
      id, job_id, full_name, email, phone, ai_summary, status, seniority, ai_recommendation, applied_at, location,
      jobs ( title )
    `)
    .not('job_id', 'is', null)
    .order('applied_at', { ascending: false })

  const candidateIds = (candidates ?? []).map((c) => c.id)

  const { data: scores } = candidateIds.length > 0
    ? await supabase
        .from('scores')
        .select('candidate_id, score, strengths')
        .in('candidate_id', candidateIds)
        .eq('stage', 'overall')
        .order('evaluated_at', { ascending: false })
    : { data: [] }

  const scoreMap = new Map();
  const skillsMap = new Map<string, string[]>();
  for (const s of scores ?? []) {
    if (!scoreMap.has(s.candidate_id)) {
      scoreMap.set(s.candidate_id, s.score);
    }
    if (!skillsMap.has(s.candidate_id)) {
      skillsMap.set(s.candidate_id, s.strengths ?? []);
    }
  }

  const enriched = (candidates ?? []).map((c: any) => ({
    id: c.id,
    full_name: c.full_name,
    email: c.email,
    phone: c.phone ?? null,
    ai_summary: c.ai_summary ?? null,
    status: c.status,
    seniority: c.seniority ?? 'Semi-Senior',
    applied_at: c.applied_at,
    job_title: c.jobs?.title ?? '',
    score: scoreMap.get(c.id) ?? 0,
    skills: skillsMap.get(c.id) ?? [],
    location: c.location ?? null,
    ai_recommendation: c.ai_recommendation ?? null,
  }))

  return <CandidatesClient candidates={enriched} />
}
