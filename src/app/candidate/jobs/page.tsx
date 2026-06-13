import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { BriefcaseIcon } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/app/_actions/auth';
import JobsList from './_components/JobsList';
import type { JobRow } from '@/types/database.types';

export const metadata: Metadata = {
  title: 'Vacantes disponibles | AI Recruitment Platform',
};

export const dynamic = 'force-dynamic';

export default async function CandidateJobsPage() {
  const ctx = await getCurrentUserContext();

  const supabase = await createServerClient();
  const [jobsResult, userResult] = await Promise.all([
    supabase.from('jobs').select('*').eq('status', 'open').order('published_at', { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const jobs = jobsResult.data ?? [];
  const user = userResult.data?.user;

  let mainResumeUrl: string;

  if (process.env.DEV_BYPASS_AUTH === 'true') {
    const c = await cookies();
    mainResumeUrl = c.get('main_resume_url')?.value ?? '';
  } else {
    mainResumeUrl = (user?.user_metadata?.main_resume_url as string) ?? '';
  }

  // Fetch jobs the user has already applied to
  let appliedJobIds: Set<string> = new Set();
  if (ctx) {
    const { data: myApps } = await supabase
      .from('candidates')
      .select('job_id')
      .eq('email', ctx.email)
      .not('job_id', 'is', null);
    appliedJobIds = new Set((myApps ?? []).map((a: any) => a.job_id));
  }

  return (
    <div className="px-8 py-10 min-h-full">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 border border-emerald-500/30">
            <BriefcaseIcon className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Vacantes disponibles</h1>
            <p className="text-sm text-slate-400">
              {jobs.length ? `${jobs.length} vacante${jobs.length !== 1 ? 's' : ''} abierta${jobs.length !== 1 ? 's' : ''}` : 'No hay vacantes abiertas en este momento'}
            </p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <BriefcaseIcon className="w-8 h-8 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No hay vacantes disponibles</h2>
            <p className="text-sm text-slate-400">
              Vuelve más tarde o revisa tus postulaciones existentes.
            </p>
          </div>
        ) : (
          <JobsList
            jobs={jobs as JobRow[]}
            mainResumeUrl={mainResumeUrl}
            appliedJobIds={appliedJobIds}
          />
        )}
      </div>
    </div>
  );
}
