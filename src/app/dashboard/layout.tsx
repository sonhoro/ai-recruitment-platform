/**
 * src/app/dashboard/layout.tsx
 *
 * Dashboard shell layout: fixed sidebar + scrollable main content.
 * Wraps all routes under /dashboard/*.
 *
 * The sidebar uses a Client Component (SidebarNav) so it can read
 * usePathname() and highlight the active route.
 */

import { Suspense }  from 'react';
import SidebarNav    from './_components/SidebarNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800">
        <Suspense fallback={null}>
          <SidebarNav />
        </Suspense>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
