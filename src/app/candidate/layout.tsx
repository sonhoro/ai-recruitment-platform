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
  let phone = '';
  let linkedinUrl = '';
  let portfolioUrl = '';
  let avatarUrl = '';

  if (ctx) {
    displayEmail = ctx.email;

    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.full_name) {
      displayName = user.user_metadata.full_name as string;
    }

    const { data: candidate } = await supabase
      .from('candidates')
      .select('full_name, phone, linkedin_url, portfolio_url, avatar_url')
      .eq('email', ctx.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (candidate) {
      if (candidate.full_name) displayName = candidate.full_name;
      if (candidate.phone) phone = candidate.phone;
      if (candidate.linkedin_url) linkedinUrl = candidate.linkedin_url;
      if (candidate.portfolio_url) portfolioUrl = candidate.portfolio_url;
      if (candidate.avatar_url) avatarUrl = candidate.avatar_url;
    }
  }

  return (
    <div className="flex h-screen bg-[#08080e] text-white overflow-hidden">
      <aside className="w-64 flex-shrink-0 flex flex-col bg-[#101016]">
        <Suspense fallback={null}>
          <CandidateSidebarNav
            displayName={displayName}
            displayEmail={displayEmail}
            phone={phone}
            linkedinUrl={linkedinUrl}
            portfolioUrl={portfolioUrl}
            avatarUrl={avatarUrl}
          />
        </Suspense>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
