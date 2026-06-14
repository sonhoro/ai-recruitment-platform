'use client';

import { useState, useMemo, useTransition } from 'react'
import { Search, Users, ChevronDown } from 'lucide-react'
import StageDropdown from '../../jobs/[id]/_components/StageDropdown'
import { updateCandidateStage } from '@/app/_actions/stages'

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn'
type Seniority = 'Junior' | 'Semi-Senior' | 'Senior'
type ScoreTier = 'high' | 'mid' | 'low'
type AiRecommendation = 'advance' | 'interview' | 'test' | 'hold' | 'discard' | null

interface Candidate {
  id: string
  full_name: string
  email: string
  job_title: string
  seniority: Seniority
  score: number
  status: Status
  skills: string[]
  applied_at: string
  ai_recommendation: AiRecommendation
}

// ─── Badge Helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  new:       { label: 'Nuevo',       className: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  screening: { label: 'Screening',   className: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  interview: { label: 'Entrevista',  className: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  offer:     { label: 'Oferta',      className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  hired:     { label: 'Contratado',  className: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  rejected:  { label: 'Rechazado',   className: 'bg-red-500/15 text-red-300 border-red-500/30' },
  withdrawn: { label: 'Retirado',    className: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
}

const SENIORITY_CONFIG: Record<Seniority, string> = {
  'Junior':      'bg-slate-500/15 text-slate-300 border-slate-500/30',
  'Semi-Senior': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'Senior':      'bg-violet-500/15 text-violet-300 border-violet-500/30',
}

function scoreTierOf(score: number): ScoreTier {
  if (score >= 80) return 'high'
  if (score >= 50) return 'mid'
  return 'low'
}

function ScoreBadge({ score }: { score: number }) {
  const tier = scoreTierOf(score)
  const cls =
    tier === 'high' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
    tier === 'mid'  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                     'bg-red-500/15 text-red-300 border-red-500/30'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${cls}`}>
      {score}
    </span>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const { label, className } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

const RECOMMENDATION_CONFIG: Record<string, { label: string; className: string }> = {
  advance:   { label: 'AI: Avanzar',   className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  interview: { label: 'AI: Entrevista', className: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  test:      { label: 'AI: Test',       className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  hold:      { label: 'AI: Hold',       className: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  discard:   { label: 'AI: Descartar',  className: 'bg-red-500/15 text-red-300 border-red-500/30' },
}

function AiRecommendationBadge({ recommendation }: { recommendation: AiRecommendation }) {
  if (!recommendation) return null
  const config = RECOMMENDATION_CONFIG[recommendation]
  if (!config) return null
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

function SeniorityChip({ seniority }: { seniority: Seniority }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${SENIORITY_CONFIG[seniority]}`}>
      {seniority}
    </span>
  )
}

function DarkSelect({
  id, value, onChange, children,
}: {
  id: string; value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 pr-8 text-sm text-slate-200 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function CandidatesClient({ candidates }: { candidates: Candidate[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [seniorityFilter, setSeniorityFilter] = useState<string>('all')
  const [scoreTierFilter, setScoreTierFilter] = useState<string>('all')
  const [, startTransition] = useTransition()

  function handleStageChange(candidateId: string, newStatus: Status) {
    startTransition(async () => {
      await updateCandidateStage(candidateId, newStatus as any)
    })
  }

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      const q = search.toLowerCase()
      const matchSearch = !q || c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      const matchSeniority = seniorityFilter === 'all' || c.seniority === seniorityFilter
      const matchScore = scoreTierFilter === 'all' || scoreTierOf(c.score) === scoreTierFilter
      return matchSearch && matchStatus && matchSeniority && matchScore
    })
  }, [search, statusFilter, seniorityFilter, scoreTierFilter, candidates])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white">Candidatos</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300">
            <Users size={12} />
            {candidates.length}
          </span>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="candidate-search"
            type="text"
            placeholder="Buscar por nombre o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <DarkSelect id="filter-status" value={statusFilter} onChange={setStatusFilter}>
          <option value="all">Todos los estados</option>
          <option value="new">Nuevo</option>
          <option value="screening">Screening</option>
          <option value="interview">Entrevista</option>
          <option value="offer">Oferta</option>
          <option value="hired">Contratado</option>
          <option value="rejected">Rechazado</option>
        </DarkSelect>
        <DarkSelect id="filter-seniority" value={seniorityFilter} onChange={setSeniorityFilter}>
          <option value="all">Todos los niveles</option>
          <option value="Junior">Junior</option>
          <option value="Semi-Senior">Semi-Senior</option>
          <option value="Senior">Senior</option>
        </DarkSelect>
        <DarkSelect id="filter-score" value={scoreTierFilter} onChange={setScoreTierFilter}>
          <option value="all">Todos los scores</option>
          <option value="high">Excelente (≥ 80)</option>
          <option value="mid">Moderado (50–79)</option>
          <option value="low">Bajo (&lt; 50)</option>
        </DarkSelect>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3">Candidato</th>
                <th className="px-4 py-3">Vacante</th>
                <th className="px-4 py-3">Seniority</th>
                <th className="px-4 py-3 text-center">Score</th>
                <th className="px-4 py-3">Recomendación IA</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 whitespace-nowrap">Aplicó</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-slate-500">
                        <Users size={24} />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-300">Sin resultados</p>
                        <p className="mt-1 text-xs text-slate-500">Prueba ajustando los filtros.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => (
                  <tr key={c.id} className="group hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-500 tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300 select-none">
                          {c.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{c.full_name}</p>
                          <p className="text-xs text-slate-500 truncate">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-[180px] truncate" title={c.job_title}>{c.job_title}</td>
                    <td className="px-4 py-3"><SeniorityChip seniority={c.seniority} /></td>
                    <td className="px-4 py-3 text-center"><ScoreBadge score={c.score} /></td>
                    <td className="px-4 py-3"><AiRecommendationBadge recommendation={c.ai_recommendation} /></td>
                    <td className="px-4 py-3">
                      <StageDropdown
                        candidateId={c.id}
                        currentStatus={c.status}
                        onStageChange={handleStageChange as any}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{formatDate(c.applied_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-800 px-4 py-3">
          <p className="text-xs text-slate-500">
            Mostrando <span className="font-semibold text-slate-300">{filtered.length}</span> de{' '}
            <span className="font-semibold text-slate-300">{candidates.length}</span> candidatos
          </p>
        </div>
      </div>
    </div>
  )
}
