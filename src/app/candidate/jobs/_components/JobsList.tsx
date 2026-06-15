'use client';

import { useState } from 'react';
import ApplyModal from './ApplyModal';
import {
  BriefcaseIcon,
  MapPinIcon,
  ClockIcon,
  WifiIcon,
  BuildingIcon,
  CheckCircleIcon,
} from 'lucide-react';
import type { JobRow } from '@/types/database.types';

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Tiempo completo',
  part_time: 'Medio tiempo',
  contract: 'Contrato',
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

interface JobsListProps {
  jobs: JobRow[];
  mainResumeUrl: string;
  appliedJobIds: Set<string>;
}

export default function JobsList({ jobs, mainResumeUrl, appliedJobIds }: JobsListProps) {
  const [applyJob, setApplyJob] = useState<{ id: string; title: string } | null>(null);

  return (
    <>
      <div className="space-y-4">
        {jobs.map((job: JobRow) => (
          <article
            key={job.id}
            className="rounded-xl border border-[#1e1e2a] bg-[#101016] p-5 hover:border-emerald-500/30 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white truncate">{job.title}</h3>
                  <span className="flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
                    Abierta
                  </span>
                </div>
                {job.department && (
                  <p className="text-sm text-slate-400 flex items-center gap-1.5 mb-3">
                    <BuildingIcon className="w-3.5 h-3.5" />
                    {job.department}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 mb-4">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-3.5 h-3.5" />
                  {job.location}
                </span>
              )}
              {job.employment_type && (
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5" />
                  {EMPLOYMENT_LABELS[job.employment_type] ?? job.employment_type}
                </span>
              )}
              {job.remote_policy && (
                <span className="flex items-center gap-1">
                  <WifiIcon className="w-3.5 h-3.5" />
                  {REMOTE_LABELS[job.remote_policy] ?? job.remote_policy}
                </span>
              )}
              <span className="flex items-center gap-1">
                Publicada {formatDate(job.published_at ?? job.created_at)}
              </span>
            </div>

            {job.description && (
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">{job.description}</p>
            )}

            {appliedJobIds.has(job.id) ? (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
                <CheckCircleIcon className="w-3 h-3" />
                Ya postulaste
              </span>
            ) : (
              <button
                onClick={() => setApplyJob({ id: job.id, title: job.title })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
              >
                Postularme
                <BriefcaseIcon className="w-4 h-4" />
              </button>
            )}
          </article>
        ))}
      </div>

      {applyJob && (
        <ApplyModal
          jobId={applyJob.id}
          jobTitle={applyJob.title}
          mainResumeUrl={mainResumeUrl}
          onClose={() => setApplyJob(null)}
        />
      )}
    </>
  );
}
