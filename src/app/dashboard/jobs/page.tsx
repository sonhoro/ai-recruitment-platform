/**
 * src/app/dashboard/jobs/page.tsx
 *
 * Jobs Dashboard — SERVER COMPONENT
 *
 * Responsibilities:
 *   1. Fetches all active jobs (with candidate counts) on the server.
 *   2. Handles the fetch error by rendering an inline error banner.
 *   3. Passes the result to <JobsPageClient> for interactive rendering.
 *
 * Data flow:
 *   Server (getJobs) → page.tsx → JobsPageClient → JobCard
 *                                               ↘ CreateJobModal → createJob (Server Action)
 *                                                                       ↓
 *                                                              revalidatePath → page re-renders
 */

import { AlertCircleIcon } from 'lucide-react';
import { getJobs } from '@/app/_actions/jobs';
import JobsPageClient from './_components/JobsPageClient';

export const metadata = {
  title: 'Vacantes | AI Recruitment Platform',
  description: 'Gestiona todas tus vacantes activas y monitorea el pipeline de candidatos.',
};

// Force dynamic rendering so the page is never served stale from the
// Next.js full-route cache. Required for pages backed by Supabase Auth.
export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  const result = await getJobs();

  // ── Error state ────────────────────────────────────────────
  if (!result.success) {
    return (
      <div className="px-8 py-10">
        <div className="flex items-start gap-3 rounded-xl border border-red-700/40 bg-red-900/20 px-5 py-4 text-sm text-red-300">
          <AlertCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-200 mb-0.5">
              Error al cargar las vacantes
            </p>
            <p className="text-red-400">{result.error}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Happy path ─────────────────────────────────────────────
  return (
    <div className="px-8 py-10 min-h-full">
      <JobsPageClient initialJobs={result.data} />
    </div>
  );
}
