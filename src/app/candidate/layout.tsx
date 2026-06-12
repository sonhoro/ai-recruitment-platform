import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/app/_actions/auth';
import CandidateSidebarNav from './_components/SidebarNav';

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getCurrentUserContext();

  let displayName = 'Candidato';
  let displayEmail = '';

  if (ctx) {
    displayEmail = ctx.email;
    displayName = ctx.email.split('@')[0];

    // Try to get full_name from database
    const supabase = await createServerClient();
    const { data: candidate } = await supabase
      .from('candidates')
      .select('full_name')
      .eq('email', ctx.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (candidate?.full_name) {
      displayName = candidate.full_name;
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <aside className="w-64 flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800">
        <Suspense fallback={null}>
          <CandidateSidebarNav displayName={displayName} displayEmail={displayEmail} />
        </Suspense>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
