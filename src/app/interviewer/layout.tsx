import { Suspense } from 'react';
import InterviewerSidebarNav from './_components/SidebarNav';

export default function InterviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#08080e] text-white overflow-hidden">
      <aside className="w-64 flex-shrink-0 flex flex-col bg-[#101016]">
        <Suspense fallback={null}>
          <InterviewerSidebarNav />
        </Suspense>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
