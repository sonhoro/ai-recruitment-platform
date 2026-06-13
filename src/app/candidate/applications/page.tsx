import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/app/_actions/auth';
import { BriefcaseIcon, AlertCircleIcon } from 'lucide-react';
import ApplicationsList from './_components/ApplicationsList';

export const metadata: Metadata = {
  title: 'Mis postulaciones | AI Recruitment Platform',
};

export const dynamic = 'force-dynamic';

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
    .not('job_id', 'is', null)
    .order('applied_at', { ascending: false });

  // Filter out any results without a valid job relation
  // Defensive: jobs.title is NOT NULL in the schema — if it's missing,
  // the join failed (null FK, missing FK target, or Supabase join quirk).
  const validApplications = (rawApplications ?? []).filter(
    (app: any) => {
      if (!app.job_id) return false;
      if (!app.jobs) return false;
      if (!app.jobs.title) return false;
      return true;
    },
  );

  // Fetch scores for each application
  const applications = validApplications.map((app: any) => ({ ...app, score: null as number | null }));
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
          <p className="text-sm text-slate-400 mb-6">
            Debes aplicar a una vacante primero para que aparezca aquí.
          </p>
          <a
            href="/candidate/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          >
            <BriefcaseIcon className="w-4 h-4" />
            Ver vacantes disponibles
          </a>
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

        <ApplicationsList applications={applications as any} />
      </div>
    </div>
  );
}
