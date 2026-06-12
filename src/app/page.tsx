import { redirect } from 'next/navigation';

/**
 * Root page — redirects to the jobs dashboard.
 * Auth guard is handled by middleware.ts.
 */
export default function RootPage() {
  redirect('/dashboard/jobs');
}
