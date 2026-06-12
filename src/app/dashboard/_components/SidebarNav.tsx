'use client';

/**
 * src/app/dashboard/_components/SidebarNav.tsx
 *
 * Client component: reads usePathname() to highlight the active nav link.
 * Rendered inside a <Suspense> boundary in DashboardLayout.
 */

import Link                 from 'next/link';
import { usePathname }      from 'next/navigation';
import {
  BriefcaseIcon,
  UsersIcon,
  CalendarIcon,
  BarChart3Icon,
  SettingsIcon,
  ZapIcon,
  SparklesIcon,
  LogOutIcon,
} from 'lucide-react';
import { signOut } from '@/app/_actions/auth';

// ─────────────────────────────────────────────────────────────
// Nav items
// ─────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/dashboard/jobs',        label: 'Vacantes',      icon: BriefcaseIcon },
  { href: '/dashboard/candidates',  label: 'Candidatos',    icon: UsersIcon },
  { href: '/dashboard/interviews',  label: 'Entrevistas',   icon: CalendarIcon },
  { href: '/dashboard/analytics',   label: 'Analytics',     icon: BarChart3Icon },
  { href: '/dashboard/settings',    label: 'Configuración', icon: SettingsIcon },
] as const;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Logo ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
          <ZapIcon className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <span className="font-semibold text-sm text-white block leading-tight">
            AI Recruitment
          </span>
          <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
            Platform
          </span>
        </div>
      </div>

      {/* ── Nav links ─────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                transition-all duration-150 group relative
                ${isActive
                  ? 'bg-violet-500/15 text-violet-300 font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }
              `}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-400 rounded-r-full" />
              )}

              <Icon
                className={`
                  w-4 h-4 flex-shrink-0 transition-colors
                  ${isActive ? 'text-violet-400' : 'group-hover:text-violet-400'}
                `}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── AI badge ──────────────────────────────────────── */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2.5">
          <SparklesIcon className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-violet-300 leading-tight">
              Powered by IA
            </p>
            <p className="text-[10px] text-violet-500 truncate">
              Claude · n8n · Supabase
            </p>
          </div>
        </div>
      </div>

      {/* ── User + Logout ──────────────────────────────── */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex-shrink-0 ring-2 ring-violet-500/20" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">Reclutador</p>
            <p className="text-xs text-slate-500 truncate">recruiter@empresa.com</p>
          </div>
          {/* Logout button */}
          <form action={signOut}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150"
            >
              <LogOutIcon className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
