import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/app/_actions/auth';
import {
  BriefcaseIcon,
  BuildingIcon,
  MapPinIcon,
  ClockIcon,
  StarIcon,
  FileTextIcon,
  AlertCircleIcon,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mis postulaciones | AI Recruitment Platform',
};

export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  screening: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  interview: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  offer: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  hired: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
  withdrawn: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo',
  screening: 'En revisión',
  interview: 'Entrevista',
  offer: 'Oferta',
  hired: 'Contratado',
  rejected: 'Rechazado',
  withdrawn: 'Retirado',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] ?? 'bg-slate-500/20 text-slate-400'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default async function CandidateApplicationsPage() {
  const supabase = await createServerClient();
  const ctx = await getCurrentUserContext();

  if (!ctx) {
    return (
      <div className="px-8 py-10">
        <div className="flex items-start gap-3 rounded-xl border border-red-700/40 bg-red-900/20 px-5 py-4 text-sm text-red-300">
          <AlertCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-200 mb-0.5">Sesión no encontrada</p>
            <p className="text-red-400">Inicia sesión para ver tus postulaciones.</p>
          </div>
        </div>
      </div>
    );
  }

  const { data: rawApplications } = await supabase
    .from('candidates')
    .select(`
      id,
      job_id,
      full_name,
      email,
      status,
      applied_at,
      ai_summary,
      resume_url,
      jobs ( title, department, location, remote_policy )
    `)
    .eq('email', ctx.email)
    .order('applied_at', { ascending: false });

  // Fetch scores for each application
  const applications = (rawApplications ?? []).map((app: any) => ({ ...app, score: null as number | null }));
  if (applications.length > 0) {
    const ids = applications.map((a: any) => a.id);
    const { data: scores } = await supabase
      .from('scores')
      .select('candidate_id, score')
      .in('candidate_id', ids)
      .eq('stage', 'overall');

    const scoreMap = new Map((scores ?? []).map((s: any) => [s.candidate_id, s.score]));
    for (const app of applications) {
      app.score = scoreMap.get(app.id) ?? null;
    }
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="px-8 py-10 min-h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <BriefcaseIcon className="w-8 h-8 text-slate-600" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No tienes postulaciones</h2>
          <p className="text-sm text-slate-400">
            Aún no te has postulado a ninguna vacante. Cuando lo hagas, aparecerán aquí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-10 min-h-full">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 border border-emerald-500/30">
            <BriefcaseIcon className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Mis postulaciones</h1>
            <p className="text-sm text-slate-400">{applications.length} vacante{(applications.length !== 1) ? 's' : ''}</p>
          </div>
        </div>

        <div className="space-y-3">
          {applications.map((app: any) => {
            const job = app.jobs ?? {};
            const appliedDate = new Date(app.applied_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <div
                key={app.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{job.title ?? 'Vacante'}</h3>
                    <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <BuildingIcon className="w-3.5 h-3.5" />
                      {job.department ?? 'Sin departamento'}
                      {job.location && (
                        <>
                          <span className="text-slate-600">·</span>
                          <MapPinIcon className="w-3.5 h-3.5" />
                          {job.location}
                        </>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                {app.ai_summary && (
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">{app.ai_summary}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5" />
                    Postulado {appliedDate}
                  </span>
                  {app.score != null && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <StarIcon className="w-3.5 h-3.5" />
                      Score IA: {Math.round(app.score)}/100
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4">
                  {app.resume_url && (
                    <a
                      href={app.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                    >
                      <FileTextIcon className="w-3.5 h-3.5" />
                      Ver CV
                    </a>
                  )}
                  <a
                    href={`/candidate/upload-cv?job_id=${app.job_id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                  >
                    <FileTextIcon className="w-3.5 h-3.5" />
                    Actualizar CV
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
