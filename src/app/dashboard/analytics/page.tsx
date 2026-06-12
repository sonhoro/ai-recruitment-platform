import type { Metadata } from 'next'
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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STATS = {
  total_candidates: 47,
  total_vacancies: 6,
  avg_score: 72,
  hired: 3,
}

const PIPELINE = [
  { key: 'new', label: 'Nuevo', count: 8, color: 'border-slate-500', bg: 'bg-slate-500' },
  { key: 'screening', label: 'Screening', count: 12, color: 'border-sky-500', bg: 'bg-sky-500' },
  { key: 'interview', label: 'Entrevista', count: 15, color: 'border-violet-500', bg: 'bg-violet-500' },
  { key: 'offer', label: 'Oferta', count: 7, color: 'border-amber-500', bg: 'bg-amber-500' },
  { key: 'hired', label: 'Contratado', count: 3, color: 'border-emerald-500', bg: 'bg-emerald-500' },
  { key: 'rejected', label: 'Rechazado', count: 2, color: 'border-red-500', bg: 'bg-red-500' },
]

const SCORE_TIERS = [
  { label: '≥ 80 — Excelente', count: 18, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  { label: '50–79 — Moderado', count: 22, color: 'bg-amber-500', textColor: 'text-amber-400' },
  { label: '< 50 — Bajo', count: 7, color: 'bg-red-500', textColor: 'text-red-400' },
]

const SENIORITY = [
  { label: 'Junior', count: 14, color: 'bg-slate-500', textColor: 'text-slate-400' },
  { label: 'Semi-Senior', count: 20, color: 'bg-violet-500', textColor: 'text-violet-400' },
  { label: 'Senior', count: 13, color: 'bg-sky-500', textColor: 'text-sky-400' },
]

const TOP_VACANCIES = [
  { title: 'Senior Frontend Engineer', candidates: 12, avg_score: 78, department: 'Ingeniería' },
  { title: 'Backend Python Developer', candidates: 9, avg_score: 71, department: 'Ingeniería' },
  { title: 'DevOps Engineer', candidates: 8, avg_score: 65, department: 'Infraestructura' },
  { title: 'Product Designer UI/UX', candidates: 7, avg_score: 82, department: 'Diseño' },
  { title: 'Data Engineer', candidates: 6, avg_score: 69, department: 'Datos' },
  { title: 'QA Automation Engineer', candidates: 5, avg_score: 74, department: 'Calidad' },
]

const RECENT_ACTIVITY = [
  { candidate: 'María González', action: 'Avanzó a Entrevista', vacancy: 'Senior Frontend Engineer', time: 'Hace 2h', icon: 'interview' },
  { candidate: 'Carlos Ramírez', action: 'CV Analizado por IA — Score 88', vacancy: 'Backend Python Developer', time: 'Hace 3h', icon: 'ai' },
  { candidate: 'Ana Martínez', action: 'Oferta enviada', vacancy: 'Product Designer UI/UX', time: 'Hace 5h', icon: 'offer' },
  { candidate: 'Luis Herrera', action: 'Contratado', vacancy: 'DevOps Engineer', time: 'Ayer', icon: 'hired' },
  { candidate: 'Sofia Chen', action: 'CV subido', vacancy: 'Data Engineer', time: 'Ayer', icon: 'upload' },
]

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
      return <span className={`${base} bg-violet-500/20 text-violet-400`}><MessageSquare size={16} /></span>
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

export default function AnalyticsPage() {
  const pipelineMax = Math.max(...PIPELINE.map((s) => s.count))
  const totalCandidates = PIPELINE.reduce((acc, s) => acc + s.count, 0)
  const scoreTiersTotal = SCORE_TIERS.reduce((acc, t) => acc + t.count, 0)
  const seniorityTotal = SENIORITY.reduce((acc, s) => acc + s.count, 0)
  const seniorityMax = Math.max(...SENIORITY.map((s) => s.count))
  const scoreTiersMax = Math.max(...SCORE_TIERS.map((t) => t.count))

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">

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
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          Datos simulados — conecta Supabase para datos reales
        </span>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Candidatos */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total Candidatos</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
              <Users size={16} />
            </span>
          </div>
          <div className="text-3xl font-bold text-white">{STATS.total_candidates}</div>
          <p className="text-xs text-slate-500">{STATS.total_vacancies} vacantes activas</p>
        </div>

        {/* Score Promedio */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Score Promedio</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
              <BarChart3 size={16} />
            </span>
          </div>
          <div className="text-3xl font-bold text-white">{STATS.avg_score}<span className="text-lg font-normal text-slate-500">/100</span></div>
          <div className="h-1.5 w-full rounded-full bg-slate-800">
            <div
              className="h-1.5 rounded-full bg-sky-500"
              style={{ width: `${STATS.avg_score}%` }}
            />
          </div>
        </div>

        {/* En Entrevista */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">En Entrevista</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <Calendar size={16} />
            </span>
          </div>
          <div className="text-3xl font-bold text-white">15</div>
          <p className="text-xs text-slate-500">32% del total del pipeline</p>
        </div>

        {/* Contratados */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Contratados</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400">
              <BadgeCheck size={16} />
            </span>
          </div>
          <div className="text-3xl font-bold text-white">{STATS.hired}</div>
          <p className="text-xs text-slate-500">de {STATS.total_vacancies} vacantes cubiertas</p>
        </div>
      </div>

      {/* ── Pipeline Funnel ── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Pipeline de Candidatos</h2>
          <span className="text-xs text-slate-500">{totalCandidates} total</span>
        </div>
        <div className="space-y-3">
          {PIPELINE.map((stage) => {
            const pct = Math.round((stage.count / totalCandidates) * 100)
            const barWidth = Math.round((stage.count / pipelineMax) * 100)
            return (
              <div key={stage.key} className="flex items-center gap-4">
                <span className="w-24 flex-shrink-0 text-sm font-medium text-slate-300">
                  {stage.label}
                </span>
                <div className="flex flex-1 items-center gap-3">
                  <div
                    className={`h-8 rounded-r-md border-l-4 ${stage.color} bg-slate-800 flex items-center px-3`}
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
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Distribución de Scores</h2>
          <div className="space-y-4">
            {SCORE_TIERS.map((tier) => {
              const pct = Math.round((tier.count / scoreTiersTotal) * 100)
              const barWidth = Math.round((tier.count / scoreTiersMax) * 100)
              return (
                <div key={tier.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${tier.textColor}`}>{tier.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{tier.count}</span>
                      <span className="text-xs text-slate-500">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-800">
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
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Nivel de Seniority</h2>
          <div className="space-y-4">
            {SENIORITY.map((s) => {
              const pct = Math.round((s.count / seniorityTotal) * 100)
              const barWidth = Math.round((s.count / seniorityMax) * 100)
              return (
                <div key={s.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${s.textColor}`}>{s.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{s.count}</span>
                      <span className="text-xs text-slate-500">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-800">
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
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Top Vacantes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="pb-3 pr-4">Vacante</th>
                <th className="pb-3 pr-4">Depto</th>
                <th className="pb-3 pr-4 text-right">Candidatos</th>
                <th className="pb-3 pr-4 text-right">Score Prom.</th>
                <th className="pb-3">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {TOP_VACANCIES.map((v) => (
                <tr key={v.title} className="group hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 pr-4 font-medium text-white">{v.title}</td>
                  <td className="py-3 pr-4 text-slate-400">{v.department}</td>
                  <td className="py-3 pr-4 text-right text-slate-300">{v.candidates}</td>
                  <td className={`py-3 pr-4 text-right font-semibold ${scoreTextColor(v.avg_score)}`}>
                    {v.avg_score}
                  </td>
                  <td className="py-3 w-28">
                    <div className="h-2 w-full rounded-full bg-slate-800">
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
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Actividad Reciente</h2>
        <ul className="space-y-1 divide-y divide-slate-800/60">
          {RECENT_ACTIVITY.map((item, idx) => (
            <li key={idx} className="flex items-start gap-4 py-3 group hover:bg-slate-800/30 rounded-lg px-2 -mx-2 transition-colors">
              <ActivityIcon type={item.icon} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold text-white">{item.candidate}</span>
                  {' '}
                  <span className="text-slate-300">{item.action}</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-500 truncate">{item.vacancy}</p>
              </div>
              <span className="flex-shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                {item.time}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
