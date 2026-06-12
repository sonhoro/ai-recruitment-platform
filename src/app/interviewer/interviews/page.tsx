import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/app/_actions/auth';
import {
  CalendarIcon,
  UserIcon,
  ClockIcon,
  VideoIcon,
  LinkIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  StarIcon,
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mis entrevistas | AI Recruitment Platform',
};

export const dynamic = 'force-dynamic';

const TYPE_CONFIG: Record<string, { label: string; classes: string }> = {
  phone_screen: { label: 'Screening Telefónico', classes: 'bg-sky-500/20 text-sky-300 border border-sky-500/30' },
  technical: { label: 'Técnica', classes: 'bg-violet-500/20 text-violet-300 border border-violet-500/30' },
  behavioral: { label: 'Conductual', classes: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
  panel: { label: 'Panel', classes: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' },
  final: { label: 'Final', classes: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
};

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  scheduled: { label: 'Programada', classes: 'bg-sky-500/20 text-sky-300 border border-sky-500/30' },
  confirmed: { label: 'Confirmada', classes: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
  completed: { label: 'Completada', classes: 'bg-slate-500/20 text-slate-400 border border-slate-500/30' },
};

function formatDateTime(iso: string, duration: number): string {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  };
  const dateStr = d.toLocaleDateString('es-ES', opts);
  return `${dateStr} · ${duration} min`;
}

export default async function InterviewerInterviewsPage() {
  const supabase = await createServerClient();
  const ctx = await getCurrentUserContext();

  if (!ctx) {
    return (
      <div className="px-8 py-10">
        <div className="flex items-start gap-3 rounded-xl border border-red-700/40 bg-red-900/20 px-5 py-4 text-sm text-red-300">
          <AlertCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div><p className="font-semibold text-red-200 mb-0.5">Sesión no encontrada</p></div>
        </div>
      </div>
    );
  }

  const { data: recruiter } = await supabase
    .from('recruiters')
    .select('id, full_name')
    .eq('email', ctx.email)
    .maybeSingle();

  if (!recruiter) {
    return (
      <div className="px-8 py-10">
        <div className="flex items-start gap-3 rounded-xl border border-red-700/40 bg-red-900/20 px-5 py-4 text-sm text-red-300">
          <AlertCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div><p className="font-semibold text-red-200 mb-0.5">Perfil no encontrado</p></div>
        </div>
      </div>
    );
  }

  const { data: rawInterviews } = await supabase
    .from('interviews')
    .select(`
      id, interview_type, status, scheduled_at, duration_minutes, meeting_url, feedback, rating, outcome,
      candidates ( full_name, email ),
      jobs ( title, department )
    `)
    .contains('interviewer_ids', [recruiter.id])
    .order('scheduled_at', { ascending: true });

  const interviews = (rawInterviews ?? []).filter(Boolean);

  const upcoming = interviews.filter(
    (i) => i.status === 'scheduled' || i.status === 'confirmed',
  );
  const completed = interviews.filter((i) => i.status === 'completed');

  return (
    <div className="px-8 py-10 min-h-full">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/20 border border-amber-500/30">
            <CalendarIcon className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Mis entrevistas</h1>
            <p className="text-sm text-slate-400">
              {upcoming.length} pendiente{(upcoming.length !== 1) ? 's' : ''} · {completed.length} completada{(completed.length !== 1) ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Pendientes</h2>
            <div className="grid grid-cols-1 gap-3">
              {upcoming.map((interview: any) => {
                const typeCfg = TYPE_CONFIG[interview.interview_type] ?? TYPE_CONFIG.technical;
                const statusCfg = STATUS_CONFIG[interview.status] ?? STATUS_CONFIG.scheduled;
                const candidate = interview.candidates ?? {};
                const job = interview.jobs ?? {};

                return (
                  <Link
                    key={interview.id}
                    href={`/interviewer/interviews/${interview.id}`}
                    className="rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-amber-500/40 transition-colors block"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{candidate.full_name ?? '—'}</h3>
                          <p className="text-xs text-slate-500">{candidate.email ?? ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeCfg.classes}`}>
                          {typeCfg.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.classes}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {formatDateTime(interview.scheduled_at, interview.duration_minutes)}
                      </span>
                      <span>{job.title ?? ''}</span>
                    </div>

                    {interview.meeting_url && (
                      <div className="flex items-center gap-1 text-xs text-sky-400 mt-2">
                        <VideoIcon className="w-3 h-3" />
                        Enlace disponible
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Completadas</h2>
            <div className="space-y-2">
              {completed.map((interview: any) => {
                const candidate = interview.candidates ?? {};
                const job = interview.jobs ?? {};

                return (
                  <Link
                    key={interview.id}
                    href={`/interviewer/interviews/${interview.id}`}
                    className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{candidate.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-500 truncate">{job.title ?? ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {interview.rating && (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <StarIcon className="w-3.5 h-3.5" />
                          {interview.rating}/5
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30">
                        {interview.outcome === 'pass' ? 'Aprobado' : interview.outcome === 'fail' ? 'Rechazado' : 'Pendiente'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {interviews.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No tienes entrevistas asignadas</h2>
            <p className="text-sm text-slate-400">Cuando te asignen una entrevista, aparecerá aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
}
