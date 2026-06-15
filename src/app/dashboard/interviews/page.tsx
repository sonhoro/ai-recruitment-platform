import type { Metadata } from 'next'
import { CalendarIcon, UserIcon } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import InterviewCardClient from './_components/InterviewCardClient'
import type { InterviewItem } from './_components/InterviewCardClient'

export const metadata: Metadata = {
  title: 'Entrevistas | AI Recruitment Platform',
}

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

// ---------------------------------------------------------------------------
// Stat chip
// ---------------------------------------------------------------------------
function StatChip({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${color}`}>
      <span className="text-base font-bold">{value}</span>
      <span className="text-xs font-medium opacity-80">{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function InterviewsPage() {
  const supabase = await createServerClient()

  const { data: rawInterviews } = await supabase
    .from('interviews')
    .select(`
      *,
      candidates ( id, full_name, email, seniority ),
      jobs ( title, department ),
      recruiters ( id, full_name )
    `)
    .order('scheduled_at', { ascending: true })

  const candidateIds = [...new Set((rawInterviews ?? []).map((i: any) => i.candidates?.id).filter(Boolean))]

  const { data: scores } = candidateIds.length > 0
    ? await supabase
        .from('scores')
        .select('candidate_id, score')
        .in('candidate_id', candidateIds)
        .eq('stage', 'overall')
        .order('evaluated_at', { ascending: false })
    : { data: [] }

  const scoreMap = new Map<string, number>();
  for (const s of scores ?? []) {
    if (!scoreMap.has(s.candidate_id)) {
      scoreMap.set(s.candidate_id, s.score);
    }
  }

  const interviews: InterviewItem[] = (rawInterviews ?? []).map((i: any) => ({
    id: i.id,
    candidate_name: i.candidates?.full_name ?? '—',
    candidate_email: i.candidates?.email ?? '',
    job_title: i.jobs?.title ?? '—',
    department: i.jobs?.department ?? '—',
    interview_type: i.interview_type,
    status: i.status,
    scheduled_at: i.scheduled_at,
    duration_minutes: i.duration_minutes ?? 60,
    interviewer: i.recruiters?.full_name ?? '—',
    recruiter_id: i.recruiter_id ?? null,
    score: scoreMap.get(i.candidates?.id) ?? 0,
    seniority: i.candidates?.seniority ?? 'Semi-Senior',
    meet_link: i.meeting_url,
  }))

  const upcoming = interviews.filter(
    (i) => i.status === 'por_programar' || i.status === 'scheduled'
  )
  const completed = interviews.filter((i) => i.status === 'completed')

  const porProgramar = interviews.filter((i) => i.status === 'por_programar').length
  const scheduled = interviews.filter((i) => i.status === 'scheduled').length
  const completedCount = completed.length

  const thisWeek = interviews.filter((i) => {
    const d = new Date(i.scheduled_at)
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    return d >= weekStart && d < weekEnd
  }).length

  return (
    <main className="min-h-screen bg-[#08080e] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 border border-brand-500/20">
              <CalendarIcon className="h-5 w-5 text-brand-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Entrevistas</h1>
              <p className="text-sm text-slate-400">Gestión y seguimiento de entrevistas</p>
            </div>
          </div>

          {/* Header badges */}
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {porProgramar} Por programar
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {scheduled} Programadas
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">
              {completedCount} Completadas
            </span>
          </div>
        </div>

        {/* ── KPI mini-row ── */}
        <div className="flex flex-wrap gap-2">
          <StatChip
            label="Por programar"
            value={porProgramar}
            color="bg-amber-500/10 border-amber-500/30 text-amber-300"
          />
          <StatChip
            label="Programadas"
            value={scheduled}
            color="bg-sky-500/10 border-sky-500/30 text-sky-300"
          />
          <StatChip
            label="Completadas"
            value={completedCount}
            color="bg-[#262633] border-slate-600/30 text-slate-300"
          />
          <StatChip
            label="Esta semana"
            value={thisWeek}
            color="bg-brand-500/10 border-brand-500/20 text-brand-300"
          />
        </div>

        {/* ── Upcoming ── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
            Próximas Entrevistas
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcoming.map((interview) => (
              <InterviewCardClient
                key={interview.id}
                interview={interview}
                isUpcoming
              />
            ))}
          </div>
        </section>

        {/* ── Completed ── */}
        {completed.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
              Completadas
            </h2>
            <div className="flex flex-col gap-2">
              {completed.map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl bg-[#101016] border border-[#1e1e2a] hover:border-[#262633] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-[#191922] flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{interview.candidate_name}</p>
                      <p className="text-xs text-slate-500 truncate">{interview.job_title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5 text-slate-500 text-xs">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <span>
                        {formatDate(interview.scheduled_at)} · {formatTime(interview.scheduled_at)}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      interview.score >= 85
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : interview.score >= 70
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}>
                      ★ {interview.score}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30">
                      Completada
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
