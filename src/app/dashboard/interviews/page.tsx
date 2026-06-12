import type { Metadata } from 'next'
import {
  CalendarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  VideoIcon,
  LinkIcon,
} from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Entrevistas | AI Recruitment Platform',
}

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type InterviewType = 'phone_screen' | 'technical' | 'behavioral' | 'panel' | 'final'
type InterviewStatus = 'scheduled' | 'confirmed' | 'completed'

const TYPE_CONFIG: Record<
  InterviewType,
  { label: string; classes: string }
> = {
  phone_screen: {
    label: 'Screening Telefónico',
    classes: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  },
  technical: {
    label: 'Técnica',
    classes: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  },
  behavioral: {
    label: 'Conductual',
    classes: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  },
  panel: {
    label: 'Panel',
    classes: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  },
  final: {
    label: 'Final',
    classes: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  },
}

const STATUS_CONFIG: Record<
  InterviewStatus,
  { label: string; classes: string }
> = {
  scheduled: {
    label: 'Programada',
    classes: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  },
  confirmed: {
    label: 'Confirmada',
    classes: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  },
  completed: {
    label: 'Completada',
    classes: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  },
}

const SENIORITY_COLORS: Record<string, string> = {
  Junior: 'bg-teal-500/20 text-teal-300',
  'Semi-Senior': 'bg-blue-500/20 text-blue-300',
  Senior: 'bg-purple-500/20 text-purple-300',
}

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

function formatDateTime(iso: string, duration: number): string {
  const d = new Date(iso)
  const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' })
  const day = d.getDate()
  const month = d.toLocaleDateString('es-ES', { month: 'short' })
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day} ${month.charAt(0).toUpperCase() + month.slice(1)} · ${time} · ${duration} min`
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 85
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : score >= 70
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : 'bg-red-500/20 text-red-300 border-red-500/30'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      ★ {score}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface InterviewItem {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  department: string;
  interview_type: string;
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  interviewer: string;
  score: number;
  seniority: string;
  meet_link: string | null;
}

// ---------------------------------------------------------------------------
// Card for upcoming interviews
// ---------------------------------------------------------------------------
function InterviewCard({
  interview,
}: {
  interview: InterviewItem
}) {
  const typeKey = interview.interview_type as InterviewType
  const statusKey = interview.status as InterviewStatus
  const typeCfg = TYPE_CONFIG[typeKey] ?? TYPE_CONFIG.technical
  const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.scheduled
  const seniorityCls = SENIORITY_COLORS[interview.seniority] ?? 'bg-slate-500/20 text-slate-300'

  return (
    <div className="relative flex flex-col gap-4 rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-violet-500/40 transition-colors">
      {/* Top row: type chip + status */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeCfg.classes}`}>
          {typeCfg.label}
        </span>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.classes}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Candidate name + seniority + score */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold text-white leading-tight">
            {interview.candidate_name}
          </h3>
          <span className={`self-start px-2 py-0.5 rounded-full text-xs font-medium ${seniorityCls}`}>
            {interview.seniority}
          </span>
        </div>
        <ScoreBadge score={interview.score} />
      </div>

      {/* Vacancy + department */}
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-slate-200">{interview.job_title}</p>
        <p className="text-xs text-slate-500">{interview.department}</p>
      </div>

      {/* Interviewer */}
      <div className="flex items-center gap-2 text-slate-400 text-xs">
        <UserIcon className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{interview.interviewer}</span>
      </div>

      {/* Date/time */}
      <div className="flex items-center gap-2 text-slate-400 text-xs">
        <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{formatDateTime(interview.scheduled_at, interview.duration_minutes)}</span>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-800" />

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {interview.meet_link ? (
          <a
            href={interview.meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Unirse a Meet
          </a>
        ) : (
          <button
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-600 text-xs font-medium cursor-not-allowed"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Unirse a Meet
          </button>
        )}
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors">
          <CheckCircleIcon className="h-3.5 w-3.5" />
          Marcar Completada
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Compact row for completed interviews
// ---------------------------------------------------------------------------
function CompletedRow({
  interview,
}: {
  interview: InterviewItem
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
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
        <ScoreBadge score={interview.score} />
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30">
          Completada
        </span>
      </div>
    </div>
  )
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
      candidates ( full_name, email ),
      jobs ( title, department )
    `)
    .order('scheduled_at', { ascending: true })

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
    interviewer: '—',
    score: 0,
    seniority: 'Semi-Senior',
    meet_link: i.meeting_url,
  }))

  const upcoming = interviews.filter(
    (i) => i.status === 'scheduled' || i.status === 'confirmed'
  )
  const completed = interviews.filter((i) => i.status === 'completed')

  const scheduled = interviews.filter((i) => i.status === 'scheduled').length
  const confirmed = interviews.filter((i) => i.status === 'confirmed').length
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
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/30">
              <CalendarIcon className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Entrevistas</h1>
              <p className="text-sm text-slate-400">Gestión y seguimiento de entrevistas</p>
            </div>
          </div>

          {/* Header badges */}
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {scheduled} Programadas
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {confirmed} Confirmadas
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">
              {completedCount} Completadas
            </span>
          </div>
        </div>

        {/* ── KPI mini-row ── */}
        <div className="flex flex-wrap gap-2">
          <StatChip
            label="Programadas"
            value={scheduled}
            color="bg-sky-500/10 border-sky-500/30 text-sky-300"
          />
          <StatChip
            label="Confirmadas"
            value={confirmed}
            color="bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          />
          <StatChip
            label="Completadas"
            value={completedCount}
            color="bg-slate-700/40 border-slate-600/30 text-slate-300"
          />
          <StatChip
            label="Esta semana"
            value={thisWeek}
            color="bg-violet-500/10 border-violet-500/30 text-violet-300"
          />
        </div>

        {/* ── Upcoming ── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
            Próximas Entrevistas
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcoming.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
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
                <CompletedRow key={interview.id} interview={interview} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
