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
      id, full_name, email, status, seniority, applied_at, location,
      jobs ( title )
    `)
    .order('applied_at', { ascending: false })

  const candidateIds = (candidates ?? []).map((c) => c.id)

  const { data: scores } = candidateIds.length > 0
    ? await supabase
        .from('scores')
        .select('candidate_id, score')
        .in('candidate_id', candidateIds)
        .eq('stage', 'overall')
    : { data: [] }

  const scoreMap = new Map((scores ?? []).map((s) => [s.candidate_id, s.score]))

  const enriched = (candidates ?? []).map((c: any) => ({
    id: c.id,
    full_name: c.full_name,
    email: c.email,
    status: c.status,
    seniority: c.seniority ?? 'Semi-Senior',
    applied_at: c.applied_at,
    job_title: c.jobs?.[0]?.title ?? '',
    score: scoreMap.get(c.id) ?? 0,
    skills: [] as string[],
  }))

  return <CandidatesClient candidates={enriched} />
}
