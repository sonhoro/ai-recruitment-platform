import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { UploadIcon } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/app/_actions/auth';
import UploadCvForm from './_components/UploadCvForm';

export const metadata: Metadata = {
  title: 'Subir CV | AI Recruitment Platform',
};

export const dynamic = 'force-dynamic';

export default async function UploadCvPage({
  searchParams,
}: {
  searchParams: Promise<{ job_id?: string }>;
}) {
  const ctx = await getCurrentUserContext();
  const { job_id } = await searchParams;

  let email = '';
  let fullName = '';
  let existingCvName = '';

  if (ctx) {
    email = ctx.email;

    const supabase = await createServerClient();
    const { data: candidate } = await supabase
      .from('candidates')
      .select('full_name, resume_url')
      .eq('email', ctx.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (candidate?.full_name) {
      fullName = candidate.full_name;
    }

    if (candidate?.resume_url) {
      const parts = candidate.resume_url.split('/');
      existingCvName = decodeURIComponent(parts[parts.length - 1] ?? '');
    }

    if (!existingCvName) {
      const c = await cookies();
      existingCvName = c.get('main_resume_name')?.value ?? '';
    }
  }

  return (
    <div className="px-8 py-10 min-h-full">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 border border-emerald-500/30">
            <UploadIcon className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Subir CV</h1>
            <p className="text-sm text-slate-400">
              Sube tu currículum vitae en formato PDF
            </p>
          </div>
        </div>

        <UploadCvForm
          email={email}
          fullName={fullName}
          jobId={job_id ?? ''}
          existingCvName={existingCvName}
        />
      </div>
    </div>
  );
}
