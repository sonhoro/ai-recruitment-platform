import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import {
  Users,
  BarChart3,
  Calendar,
  BadgeCheck,
  ArrowUpRight,
  Brain,
  SendHorizonal,
  CheckCircle2,
  Upload,
  MessageSquare,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Analytics | AI Recruitment Platform',
}

export const dynamic = 'force-dynamic'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function scoreTextColor(score: number) {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}

function ActivityIcon({ type }: { type: string }) {
  const base = 'flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0'
  switch (type) {
    case 'interview':
      return <span className={`${base} bg-brand-500/10 text-brand-400`}><MessageSquare size={16} /></span>
    case 'ai':
      return <span className={`${base} bg-sky-500/20 text-sky-400`}><Brain size={16} /></span>
    case 'offer':
      return <span className={`${base} bg-amber-500/20 text-amber-400`}><SendHorizonal size={16} /></span>
    case 'hired':
      return <span className={`${base} bg-emerald-500/20 text-emerald-400`}><CheckCircle2 size={16} /></span>
    case 'upload':
      return <span className={`${base} bg-slate-500/20 text-slate-400`}><Upload size={16} /></span>
    default:
      return <span className={`${base} bg-slate-500/20 text-slate-400`}><ArrowUpRight size={16} /></span>
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const supabase = await createServerClient()

  // ── Parallel data fetching ──

  const [
    { count: totalVacancies },
    { count: hiredCount },
    { data: candidates },
    { data: overallScores },
    { data: recentCandidates },
    { data: jobs },
  ] = await Promise.all([
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('candidates').select('*', { count: 'exact', head: true }).eq('status', 'hired'),
    supabase.from('candidates').select('id, status, seniority, job_id, full_name').not('job_id', 'is', null),
    supabase.from('scores').select('candidate_id, score').eq('stage', 'overall'),
    supabase.from('candidates').select('id, full_name, status, updated_at, jobs ( title )').not('job_id', 'is', null).order('updated_at', { ascending: false }).limit(5),
    supabase.from('jobs').select('id, title, department').eq('status', 'open'),
  ])

  // ── STATS ──

  const totalCandidates = candidates?.length ?? 0
  const avgScore = overallScores && overallScores.length > 0
    ? Math.round(overallScores.reduce((sum, s) => sum + s.score, 0) / overallScores.length)
    : 0
  const totalVacantes = totalVacancies ?? 0
  const hired = hiredCount ?? 0

  // ── PIPELINE ──

  const pipelineMap: Record<string, number> = {
    new: 0, screening: 0, interview: 0, offer: 0, hired: 0, rejected: 0, withdrawn: 0,
  }
  for (const c of candidates ?? []) {
    pipelineMap[c.status] = (pipelineMap[c.status] ?? 0) + 1
  }

  const PIPELINE = [
    { key: 'new', label: 'Nuevo', count: pipelineMap.new, color: 'border-slate-500', bg: 'bg-slate-500' },
    { key: 'screening', label: 'Screening', count: pipelineMap.screening, color: 'border-sky-500', bg: 'bg-sky-500' },
    { key: 'interview', label: 'Entrevista', count: pipelineMap.interview, color: 'border-violet-500', bg: 'bg-violet-500' },
    { key: 'offer', label: 'Oferta', count: pipelineMap.offer, color: 'border-amber-500', bg: 'bg-amber-500' },
    { key: 'hired', label: 'Contratado', count: pipelineMap.hired, color: 'border-emerald-500', bg: 'bg-emerald-500' },
    { key: 'rejected', label: 'Rechazado', count: pipelineMap.rejected, color: 'border-red-500', bg: 'bg-red-500' },
  ]

  // ── SCORE_TIERS ──

  let highCount = 0, midCount = 0, lowCount = 0
  for (const s of overallScores ?? []) {
    if (s.score >= 80) highCount++
    else if (s.score >= 50) midCount++
    else lowCount++
  }

  const SCORE_TIERS = [
    { label: '\u2265 80 \u2014 Excelente', count: highCount, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    { label: '50\u201379 \u2014 Moderado', count: midCount, color: 'bg-amber-500', textColor: 'text-amber-400' },
    { label: '< 50 \u2014 Bajo', count: lowCount, color: 'bg-red-500', textColor: 'text-red-400' },
  ]

  // ── SENIORITY ──

  const seniorityMap: Record<string, number> = { Junior: 0, 'Semi-Senior': 0, Senior: 0 }
  for (const c of candidates ?? []) {
    if (c.seniority && seniorityMap[c.seniority] !== undefined) {
      seniorityMap[c.seniority]++
    }
  }

  const SENIORITY = [
    { label: 'Junior', count: seniorityMap.Junior, color: 'bg-slate-500', textColor: 'text-slate-400' },
    { label: 'Semi-Senior', count: seniorityMap['Semi-Senior'], color: 'bg-violet-500', textColor: 'text-brand-400' },
    { label: 'Senior', count: seniorityMap.Senior, color: 'bg-sky-500', textColor: 'text-sky-400' },
  ]

  // ── TOP_VACANCIES ──

  const scoreByCandidate = new Map<string, number>()
  for (const s of overallScores ?? []) {
    if (!scoreByCandidate.has(s.candidate_id)) {
      scoreByCandidate.set(s.candidate_id, s.score)
    }
  }

  const candidatesByJob = new Map<string, { ids: string[]; scores: number[] }>()
  for (const c of candidates ?? []) {
    if (!c.job_id) continue
    if (!candidatesByJob.has(c.job_id)) {
      candidatesByJob.set(c.job_id, { ids: [], scores: [] })
    }
    const entry = candidatesByJob.get(c.job_id)!
    entry.ids.push(c.id)
    const sc = scoreByCandidate.get(c.id)
    if (sc !== undefined) entry.scores.push(sc)
  }

  const jobStats = []
  for (const job of jobs ?? []) {
    const jc = candidatesByJob.get(job.id)
    const candidateCount = jc?.ids.length ?? 0
    const avgScoreForJob = jc && jc.scores.length > 0
      ? Math.round(jc.scores.reduce((a, b) => a + b, 0) / jc.scores.length)
      : 0
    jobStats.push({
      title: job.title,
      candidates: candidateCount,
      avg_score: avgScoreForJob,
      department: job.department ?? '',
    })
  }

  jobStats.sort((a, b) => b.candidates - a.candidates)
  const TOP_VACANCIES = jobStats.slice(0, 6)

  // ── RECENT_ACTIVITY ──

  const activityActionMap: Record<string, { action: string; icon: string }> = {
    new:       { action: 'Nuevo candidato \u2014 CV recibido', icon: 'upload' },
    screening: { action: 'En Screening', icon: 'ai' },
    interview: { action: 'Avanz\u00f3 a Entrevista', icon: 'interview' },
    offer:     { action: 'Oferta enviada', icon: 'offer' },
    hired:     { action: 'Contratado', icon: 'hired' },
    rejected:  { action: 'Rechazado', icon: 'upload' },
    withdrawn: { action: 'Se retir\u00f3 del proceso', icon: 'upload' },
  }

  function timeAgo(dateStr: string): string {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const diffMs = now - then
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Ahora'
    if (diffMin < 60) return `Hace ${diffMin}m`
    const diffHrs = Math.floor(diffMin / 60)
    if (diffHrs < 24) return `Hace ${diffHrs}h`
    const diffDays = Math.floor(diffHrs / 24)
    if (diffDays === 1) return 'Ayer'
    return `Hace ${diffDays}d`
  }

  const RECENT_ACTIVITY = (recentCandidates ?? []).map((c) => {
    const info = activityActionMap[c.status] ?? { action: 'Actualizaci\u00f3n de estado', icon: 'upload' }
    return {
      candidate: c.full_name,
      action: info.action,
      vacancy: (c.jobs as { title?: string } | null)?.title ?? '',
      time: timeAgo(c.updated_at),
      icon: info.icon,
    }
  })

  // ── Derived values ──

  const pipelineTotal = PIPELINE.reduce((acc, s) => acc + s.count, 0)
  const pipelineMax = Math.max(...PIPELINE.map((s) => s.count), 1)
  const scoreTiersTotal = SCORE_TIERS.reduce((acc, t) => acc + t.count, 0)
  const scoreTiersMax = Math.max(...SCORE_TIERS.map((t) => t.count), 1)
  const seniorityTotal = SENIORITY.reduce((acc, s) => acc + s.count, 0)
  const seniorityMax = Math.max(...SENIORITY.map((s) => s.count), 1)
  const interviewCount = pipelineMap.interview ?? 0
  const interviewPct = pipelineTotal > 0 ? Math.round((interviewCount / pipelineTotal) * 100) : 0

  return (
    <div className="min-h-screen bg-[#08080e] text-slate-100 p-6 md:p-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Analytics de Reclutamiento
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Métricas del pipeline, distribución de scores y actividad reciente.
          </p>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Candidatos */}
        <div className="rounded-xl border border-[#1e1e2a] bg-[#101016] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total Candidatos</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
              <Users size={16} />
            </span>
          </div>
          <div className="text-3xl font-bold text-white">{totalCandidates}</div>
          <p className="text-xs text-slate-500">{totalVacantes} vacantes activas</p>
        </div>

        {/* Score Promedio */}
        <div className="rounded-xl border border-[#1e1e2a] bg-[#101016] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Score Promedio</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
              <BarChart3 size={16} />
            </span>
          </div>
          <div className="text-3xl font-bold text-white">{avgScore}<span className="text-lg font-normal text-slate-500">/100</span></div>
          <div className="h-1.5 w-full rounded-full bg-[#191922]">
            <div
              className="h-1.5 rounded-full bg-sky-500"
              style={{ width: `${avgScore}%` }}
            />
          </div>
        </div>

        {/* En Entrevista */}
        <div className="rounded-xl border border-[#1e1e2a] bg-[#101016] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">En Entrevista</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <Calendar size={16} />
            </span>
          </div>
          <div className="text-3xl font-bold text-white">{interviewCount}</div>
          <p className="text-xs text-slate-500">{interviewPct}% del total del pipeline</p>
        </div>

        {/* Contratados */}
        <div className="rounded-xl border border-[#1e1e2a] bg-[#101016] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Contratados</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400">
              <BadgeCheck size={16} />
            </span>
          </div>
          <div className="text-3xl font-bold text-white">{hired}</div>
          <p className="text-xs text-slate-500">de {totalVacantes} vacantes cubiertas</p>
        </div>
      </div>

      {/* ── Pipeline Funnel ── */}
      <div className="rounded-xl border border-[#1e1e2a] bg-[#101016] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Pipeline de Candidatos</h2>
          <span className="text-xs text-slate-500">{pipelineTotal} total</span>
        </div>
        <div className="space-y-3">
          {PIPELINE.map((stage) => {
            const pct = pipelineTotal > 0 ? Math.round((stage.count / pipelineTotal) * 100) : 0
            const barWidth = Math.round((stage.count / pipelineMax) * 100)
            return (
              <div key={stage.key} className="flex items-center gap-4">
                <span className="w-24 flex-shrink-0 text-sm font-medium text-slate-300">
                  {stage.label}
                </span>
                <div className="flex flex-1 items-center gap-3">
                  <div
                    className={`h-8 rounded-r-md border-l-4 ${stage.color} bg-[#191922] flex items-center px-3`}
                    style={{ width: `${Math.max(barWidth, 8)}%` }}
                  >
                    <span
                      className={`inline-block h-2 rounded-full ${stage.bg} transition-all`}
                      style={{ width: `${barWidth}%`, maxWidth: '100%' }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white w-5 text-right">{stage.count}</span>
                  <span className="text-xs text-slate-500 w-10">{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Score Distribution + Seniority ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* Score Distribution */}
        <div className="rounded-xl border border-[#1e1e2a] bg-[#101016] p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Distribución de Scores</h2>
          <div className="space-y-4">
            {SCORE_TIERS.map((tier) => {
              const pct = scoreTiersTotal > 0 ? Math.round((tier.count / scoreTiersTotal) * 100) : 0
              const barWidth = scoreTiersMax > 0 ? Math.round((tier.count / scoreTiersMax) * 100) : 0
              return (
                <div key={tier.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${tier.textColor}`}>{tier.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{tier.count}</span>
                      <span className="text-xs text-slate-500">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#191922]">
                    <div
                      className={`h-2.5 rounded-full ${tier.color} transition-all`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Seniority Breakdown */}
        <div className="rounded-xl border border-[#1e1e2a] bg-[#101016] p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Nivel de Seniority</h2>
          <div className="space-y-4">
            {SENIORITY.map((s) => {
              const pct = seniorityTotal > 0 ? Math.round((s.count / seniorityTotal) * 100) : 0
              const barWidth = seniorityMax > 0 ? Math.round((s.count / seniorityMax) * 100) : 0
              return (
                <div key={s.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${s.textColor}`}>{s.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{s.count}</span>
                      <span className="text-xs text-slate-500">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#191922]">
                    <div
                      className={`h-2.5 rounded-full ${s.color} transition-all`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Top Vacantes Table ── */}
      <div className="rounded-xl border border-[#1e1e2a] bg-[#101016] p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Top Vacantes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e2a] text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="pb-3 pr-4">Vacante</th>
                <th className="pb-3 pr-4">Depto</th>
                <th className="pb-3 pr-4 text-right">Candidatos</th>
                <th className="pb-3 pr-4 text-right">Score Prom.</th>
                <th className="pb-3">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2a]/60">
              {TOP_VACANCIES.map((v) => (
                <tr key={v.title} className="group hover:bg-[#191922]/40 transition-colors">
                  <td className="py-3 pr-4 font-medium text-white">{v.title}</td>
                  <td className="py-3 pr-4 text-slate-400">{v.department}</td>
                  <td className="py-3 pr-4 text-right text-slate-300">{v.candidates}</td>
                  <td className={`py-3 pr-4 text-right font-semibold ${scoreTextColor(v.avg_score)}`}>
                    {v.avg_score}
                  </td>
                  <td className="py-3 w-28">
                    <div className="h-2 w-full rounded-full bg-[#191922]">
                      <div
                        className={`h-2 rounded-full ${scoreColor(v.avg_score)}`}
                        style={{ width: `${v.avg_score}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Actividad Reciente ── */}
      <div className="rounded-xl border border-[#1e1e2a] bg-[#101016] p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Actividad Reciente</h2>
        <ul className="space-y-1 divide-y divide-[#1e1e2a]/60">
          {RECENT_ACTIVITY.map((item, idx) => (
            <li key={idx} className="flex items-start gap-4 py-3 group hover:bg-[#191922]/30 rounded-lg px-2 -mx-2 transition-colors">
              <ActivityIcon type={item.icon} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold text-white">{item.candidate}</span>
                  {' '}
                  <span className="text-slate-300">{item.action}</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-500 truncate">{item.vacancy}</p>
              </div>
              <span className="flex-shrink-0 rounded-full bg-[#191922] px-2 py-0.5 text-xs text-slate-400">
                {item.time}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
