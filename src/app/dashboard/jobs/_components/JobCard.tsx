'use client';

/**
 * src/app/dashboard/jobs/_components/JobCard.tsx
 *
 * Pure display component for a single job card.
 * Renders: title, department, location, badges, candidate count, and meta.
 *
 * Props:
 *   job         — JobWithCount row
 *   onViewClick — callback when user clicks "Ver candidatos"
 */

import type { JobWithCount } from '@/app/_actions/jobs';
import {
  MapPinIcon,
  UsersIcon,
  BriefcaseIcon,
  WifiIcon,
  ClockIcon,
  CalendarDaysIcon,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Badge helpers
// ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  open:   { label: 'Abierta',   classes: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30' },
  draft:  { label: 'Borrador',  classes: 'bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/30' },
  paused: { label: 'Pausada',   classes: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30' },
  closed: { label: 'Cerrada',   classes: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30' },
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Tiempo completo',
  part_time: 'Medio tiempo',
  contract:  'Contrato',
};

const REMOTE_LABELS: Record<string, string> = {
  remote: 'Remoto',
  hybrid: 'Híbrido',
  onsite: 'Presencial',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface JobCardProps {
  job: JobWithCount;
  onViewClick: (jobId: string) => void;
}

export default function JobCard({ job, onViewClick }: JobCardProps) {
  const status = STATUS_STYLES[job.status] ?? STATUS_STYLES.draft;

  return (
    <article className="group relative flex flex-col gap-4 rounded-xl bg-slate-800/60 border border-slate-700/50 p-5 hover:border-violet-500/40 hover:bg-slate-800 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/5">

      {/* Top row: title + status badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Icon */}
          <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
            <BriefcaseIcon className="w-4 h-4 text-violet-400" />
          </div>
          {/* Title + department */}
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm leading-snug truncate">
              {job.title}
            </h3>
            {job.department && (
              <p className="text-xs text-slate-500 mt-0.5">{job.department}</p>
            )}
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.classes}`}
        >
          {status.label}
        </span>
      </div>

      {/* Meta pills */}
      <div className="flex flex-wrap gap-2">
        {job.location && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <MapPinIcon className="w-3 h-3 text-slate-500" />
            {job.location}
          </span>
        )}
        {job.employment_type && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <ClockIcon className="w-3 h-3 text-slate-500" />
            {EMPLOYMENT_LABELS[job.employment_type] ?? job.employment_type}
          </span>
        )}
        {job.remote_policy && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <WifiIcon className="w-3 h-3 text-slate-500" />
            {REMOTE_LABELS[job.remote_policy] ?? job.remote_policy}
          </span>
        )}
      </div>

      {/* Divider */}
      <hr className="border-slate-700/60" />

      {/* Bottom row: candidate count + date + action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Candidate count */}
          <div className="flex items-center gap-1.5">
            <UsersIcon className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-white">
              {job.candidate_count}
            </span>
            <span className="text-xs text-slate-500">
              {job.candidate_count === 1 ? 'candidato' : 'candidatos'}
            </span>
          </div>
          {/* Published date */}
          <div className="flex items-center gap-1.5">
            <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500">
              {formatDate(job.published_at ?? job.created_at)}
            </span>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={() => onViewClick(job.id)}
          className="text-xs font-medium text-violet-400 hover:text-violet-300 hover:underline underline-offset-2 transition-colors"
        >
          Ver candidatos →
        </button>
      </div>
    </article>
  );
}
