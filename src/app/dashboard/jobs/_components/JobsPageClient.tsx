'use client';

/**
 * src/app/dashboard/jobs/_components/JobsPageClient.tsx
 *
 * Client Component that owns all interactive state for the Jobs page:
 *   - Modal open/close toggle
 *   - Toast notification (success / error)
 *   - Navigation to candidate detail page
 *
 * The actual data is fetched on the server (page.tsx) and passed as `initialJobs`.
 * When a job is created, Next.js revalidates /dashboard/jobs automatically
 * (triggered by `revalidatePath` inside the Server Action), so the page
 * re-renders with the fresh list without a manual client-side refetch.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  BriefcaseIcon,
  CheckCircle2Icon,
  XCircleIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react';
import type { JobWithCount } from '@/app/_actions/jobs';
import JobCard from './JobCard';
import CreateJobModal from './CreateJobModal';

// ─────────────────────────────────────────────────────────────
// Toast component (inline — no external dep needed)
// ─────────────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error';

interface ToastProps {
  message: string;
  variant: ToastVariant;
  onDismiss: () => void;
}

function Toast({ message, variant, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isSuccess = variant === 'success';

  return (
    <div
      role="alert"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-300 ${
        isSuccess
          ? 'bg-emerald-900/90 border-emerald-700/50 text-emerald-100'
          : 'bg-red-900/90 border-red-700/50 text-red-100'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2Icon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      ) : (
        <XCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
      )}
      {message}
      <button
        onClick={onDismiss}
        aria-label="Cerrar notificación"
        className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Summary stats bar
// ─────────────────────────────────────────────────────────────

function StatsBar({ jobs }: { jobs: JobWithCount[] }) {
  const openJobs      = jobs.filter((j) => j.status === 'open').length;
  const totalCandidates = jobs.reduce((acc, j) => acc + j.candidate_count, 0);
  const avgCandidates  = jobs.length > 0
    ? Math.round(totalCandidates / jobs.length)
    : 0;

  const stats = [
    { label: 'Vacantes activas',   value: openJobs,        icon: BriefcaseIcon },
    { label: 'Total candidatos',   value: totalCandidates, icon: UsersIcon },
    { label: 'Promedio por vacante', value: avgCandidates, icon: TrendingUpIcon },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {stats.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="flex items-center gap-4 rounded-xl bg-slate-800/50 border border-slate-700/40 px-5 py-4"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex-shrink-0">
            <Icon className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-5">
        <BriefcaseIcon className="w-7 h-7 text-violet-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        Sin vacantes publicadas
      </h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6">
        Crea tu primera vacante para comenzar a recibir candidatos y usar las
        evaluaciones de IA.
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all duration-150 shadow-lg shadow-violet-500/20"
      >
        <PlusIcon className="w-4 h-4" />
        Crear primera vacante
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Client Component
// ─────────────────────────────────────────────────────────────

interface JobsPageClientProps {
  initialJobs: JobWithCount[];
}

export default function JobsPageClient({ initialJobs }: JobsPageClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: ToastVariant;
  } | null>(null);

  function dismissToast() {
    setToast(null);
  }

  function handleSuccess(jobTitle: string) {
    setToast({
      message: `Vacante "${jobTitle}" creada exitosamente.`,
      variant: 'success',
    });
  }

  function handleError(message: string) {
    setToast({ message, variant: 'error' });
  }

  function handleViewCandidates(jobId: string) {
    router.push(`/dashboard/jobs/${jobId}/candidates`);
  }

  return (
    <>
      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Vacantes</h1>
          <p className="text-sm text-slate-500 mt-1">
            {initialJobs.length > 0
              ? `${initialJobs.length} ${initialJobs.length === 1 ? 'vacante' : 'vacantes'} en total`
              : 'Gestiona tus posiciones abiertas'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          id="btn-create-job"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all duration-150 shadow-lg shadow-violet-500/20"
        >
          <PlusIcon className="w-4 h-4" />
          Nueva Vacante
        </button>
      </div>

      {/* ── Stats bar ─────────────────────────────────────── */}
      {initialJobs.length > 0 && <StatsBar jobs={initialJobs} />}

      {/* ── Job grid / empty state ─────────────────────────── */}
      {initialJobs.length === 0 ? (
        <EmptyState onCreateClick={() => setIsModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {initialJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onViewClick={handleViewCandidates}
            />
          ))}
        </div>
      )}

      {/* ── Create Job Modal ───────────────────────────────── */}
      <CreateJobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        onError={handleError}
      />

      {/* ── Toast notification ─────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      )}
    </>
  );
}
