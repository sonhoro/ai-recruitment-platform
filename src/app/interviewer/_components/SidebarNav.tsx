'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarIcon,
  UserIcon,
  LogOutIcon,
  SparklesIcon,
} from 'lucide-react';
import { signOut } from '@/app/_actions/auth';

const NAV_ITEMS = [
  { href: '/interviewer/interviews', label: 'Mis entrevistas', icon: CalendarIcon },
] as const;

export default function InterviewerSidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
          <UserIcon className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <span className="font-semibold text-sm text-white block leading-tight">
            Entrevistador
          </span>
          <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
            Portal
          </span>
        </div>
      </div>

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
                  ? 'bg-amber-500/15 text-amber-300 font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }
              `}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-r-full" />
              )}
              <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-amber-400' : 'group-hover:text-amber-400'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
          <SparklesIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-amber-300 leading-tight">
              Feedback con IA
            </p>
            <p className="text-[10px] text-amber-500 truncate">
              Evaluación asistida
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex-shrink-0 ring-2 ring-amber-500/20" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">Entrevistador</p>
            <p className="text-xs text-slate-500 truncate">entrevistador@email.com</p>
          </div>
          <form action={signOut}>
            <button type="submit" title="Cerrar sesión" className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150">
              <LogOutIcon className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
