'use client';

/**
 * src/app/dashboard/jobs/[id]/_components/RankingList.tsx
 *
 * Interactive client component that owns the full ranking view state:
 *   - Accordion open/close per candidate
 *   - Stage changes via Server Action (updateCandidateStage) + optimistic UI
 *   - Filter by score tier (All / Excellent / Moderate / Low)
 *   - Stats summary header for the job
 */

import { useState, useMemo, useTransition } from 'react';
import {
  UsersIcon,
  TrendingUpIcon,
  BarChart3Icon,
  FilterIcon,
  ArrowUpDownIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LoaderIcon,
} from 'lucide-react';
import type { CandidateStatus } from '@/types/database.types';
import type { CandidateWithScore, MockJob } from '../_data/mock';
import { updateCandidateStage } from '@/app/_actions/stages';
import CandidateCard from './CandidateCard';
import ScoreBadge from './ScoreBadge';

// ─────────────────────────────────────────────────────────────
// Filter options
// ─────────────────────────────────────────────────────────────

type ScoreFilter = 'all' | 'high' | 'mid' | 'low';

const FILTER_OPTIONS: { value: ScoreFilter; label: string; color: string }[] = [
  { value: 'all', label: 'Todos',      color: 'text-slate-400' },
  { value: 'high', label: '≥ 80',      color: 'text-emerald-400' },
  { value: 'mid',  label: '50 – 79',   color: 'text-amber-400'  },
  { value: 'low',  label: '< 50',      color: 'text-red-400'    },
];

function applyScoreFilter(candidates: CandidateWithScore[], filter: ScoreFilter) {
  if (filter === 'all')  return candidates;
  if (filter === 'high') return candidates.filter((c) => c.score >= 80);
  if (filter === 'mid')  return candidates.filter((c) => c.score >= 50 && c.score < 80);
  return candidates.filter((c) => c.score < 50);
}

// ─────────────────────────────────────────────────────────────
// Stats header
// ─────────────────────────────────────────────────────────────

function JobStatsHeader({
  job,
  candidates,
}: {
  job: MockJob;
  candidates: CandidateWithScore[];
}) {
  const avgScore  = candidates.length
    ? Math.round(candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length)
    : 0;
  const topScore  = candidates.length ? Math.max(...candidates.map((c) => c.score)) : 0;
  const highCount = candidates.filter((c) => c.score >= 80).length;

  return (
    <div className="mb-8 space-y-4">

      {/* Job meta */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1">
            {job.department}
          </p>
          <h1 className="text-2xl font-bold text-white">{job.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {job.location} ·{' '}
            {{ remote: 'Remoto', hybrid: 'Híbrido', onsite: 'Presencial' }[job.remote_policy] ?? job.remote_policy}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
            Abierta
          </span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon:  UsersIcon,
            value: candidates.length,
            label: 'Candidatos',
            color: 'text-violet-400',
            bg:    'bg-violet-500/10 border-violet-500/20',
          },
          {
            icon:  BarChart3Icon,
            value: avgScore,
            label: 'Score promedio',
            color: 'text-sky-400',
            bg:    'bg-sky-500/10 border-sky-500/20',
          },
          {
            icon:  TrendingUpIcon,
            value: topScore,
            label: 'Mejor score',
            color: 'text-emerald-400',
            bg:    'bg-emerald-500/10 border-emerald-500/20',
          },
          {
            icon:  FilterIcon,
            value: highCount,
            label: 'Score ≥ 80',
            color: 'text-amber-400',
            bg:    'bg-amber-500/10 border-amber-500/20',
          },
        ].map(({ icon: Icon, value, label, color, bg }) => (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${bg}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
            <div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-[11px] text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

interface RankingListProps {
  job:        MockJob;
  candidates: CandidateWithScore[];
}

export default function RankingList({ job, candidates }: RankingListProps) {
  // Accordion: only one open at a time
  const [openId,         setOpenId]         = useState<string | null>(null);
  // Score filter
  const [scoreFilter,    setScoreFilter]    = useState<ScoreFilter>('all');
  // Optimistic stage overrides — updated immediately for instant UI feedback
  const [stageOverrides, setStageOverrides] = useState<Record<string, CandidateStatus>>({});
  // Server Action pending state
  const [isPending,      startTransition]   = useTransition();
  // Feedback banner: null | success message | error message
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  function handleToggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  /**
   * Stage change handler — optimistic update pattern:
   *   1. Immediately update local state (optimistic) for zero-latency UI.
   *   2. Call the Server Action inside startTransition (non-blocking).
   *   3. On success: show success banner + let revalidatePath refresh the page.
   *   4. On failure: roll back the optimistic override + show error banner.
   */
  function handleStageChange(candidateId: string, newStatus: CandidateStatus) {
    // Capture the previous status for potential rollback
    const candidate     = candidates.find((c) => c.id === candidateId);
    const previousStatus = stageOverrides[candidateId] ?? candidate?.status;

    // ── Optimistic update ─────────────────────────────────────────────────
    setStageOverrides((prev) => ({ ...prev, [candidateId]: newStatus }));
    setActionFeedback(null);

    // ── Persist to DB via Server Action ───────────────────────────────────
    startTransition(async () => {
      const result = await updateCandidateStage(candidateId, newStatus);

      if (result.success) {
        const notifMsg = result.notification.dispatched
          ? ' · Notificación enviada a n8n ✓'
          : ' · Notificación pendiente';

        setActionFeedback({
          type:    'success',
          message:
            `Etapa actualizada: ${result.candidate.previous_status} → ${result.candidate.new_status}` +
            notifMsg,
        });

        // Auto-hide banner after 4 seconds
        setTimeout(() => setActionFeedback(null), 4_000);

      } else {
        // ── Rollback optimistic update ────────────────────────────────────
        if (previousStatus) {
          setStageOverrides((prev) => ({ ...prev, [candidateId]: previousStatus }));
        } else {
          setStageOverrides((prev) => {
            const next = { ...prev };
            delete next[candidateId];
            return next;
          });
        }

        setActionFeedback({ type: 'error', message: result.error });
        setTimeout(() => setActionFeedback(null), 6_000);
      }
    });
  }

  // Candidates with local stage overrides applied
  const enriched = useMemo(
    () =>
      candidates.map((c) => ({
        ...c,
        status: stageOverrides[c.id] ?? c.status,
      })),
    [candidates, stageOverrides],
  );

  // Filtered + already sorted descending by score (from mock data)
  const filtered = useMemo(
    () => applyScoreFilter(enriched, scoreFilter),
    [enriched, scoreFilter],
  );

  // ─────────────────────────────────────────────────────────
  return (
    <div>
      <JobStatsHeader job={job} candidates={candidates} />

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        {/* Filter pills */}
        <div className="flex items-center gap-1.5 bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
          <FilterIcon className="w-3.5 h-3.5 text-slate-600 ml-1.5" />
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setScoreFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
                ${scoreFilter === opt.value
                  ? 'bg-slate-700 text-white shadow-sm'
                  : `text-slate-500 hover:text-slate-300`
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Result count + pending indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          {isPending ? (
            <LoaderIcon className="w-3.5 h-3.5 animate-spin text-violet-400" />
          ) : (
            <ArrowUpDownIcon className="w-3.5 h-3.5" />
          )}
          {filtered.length} candidato{filtered.length !== 1 ? 's' : ''} · ordenados por score
        </div>
      </div>

      {/* ── Action feedback banner ────────────────────────── */}
      {actionFeedback && (
        <div
          role="alert"
          className={`
            flex items-center gap-2.5 rounded-xl px-4 py-3 mb-4 text-xs font-medium
            transition-all duration-300 animate-in fade-in slide-in-from-top-1
            ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300'
                : 'bg-red-500/10 border border-red-500/25 text-red-300'
            }
          `}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircleIcon className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircleIcon className="w-4 h-4 flex-shrink-0 text-red-400" />
          )}
          {actionFeedback.message}
        </div>
      )}

      {/* ── Ranking list ──────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-slate-500 text-sm">
            Sin candidatos para el filtro seleccionado.
          </p>
          <button
            type="button"
            onClick={() => setScoreFilter('all')}
            className="mt-3 text-xs text-violet-400 hover:underline"
          >
            Ver todos
          </button>
        </div>
      ) : (
        <ol className="space-y-3" aria-label="Ranking de candidatos por score">
          {filtered.map((candidate, index) => (
            <li key={candidate.id}>
              <CandidateCard
                candidate={candidate}
                rank={index + 1}
                isOpen={openId === candidate.id}
                onToggle={() => handleToggle(candidate.id)}
                onStageChange={handleStageChange}
              />
            </li>
          ))}
        </ol>
      )}

      {/* ── Legend ──────────────────────────────────────── */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-600 font-medium">Leyenda de scores:</p>
        {[
          { score: 92, label: '≥ 80 Excelente' },
          { score: 65, label: '50–79 Moderado' },
          { score: 38, label: '< 50 Bajo'      },
        ].map(({ score, label }) => (
          <div key={label} className="flex items-center gap-2">
            <ScoreBadge score={score} size="sm" />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
