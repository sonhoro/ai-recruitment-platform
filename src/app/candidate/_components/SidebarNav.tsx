'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BriefcaseIcon,
  UploadIcon,
  FileTextIcon,
  LogOutIcon,
  SettingsIcon,
  SparklesIcon,
} from 'lucide-react';
import { signOut } from '@/app/_actions/auth';
import ProfileModal from './ProfileModal';

const NAV_ITEMS = [
  { href: '/candidate/jobs',         label: 'Vacantes disponibles', icon: BriefcaseIcon },
  { href: '/candidate/applications', label: 'Mis postulaciones',    icon: FileTextIcon },
  { href: '/candidate/upload-cv',    label: 'Subir CV',            icon: UploadIcon },
] as const;

interface SidebarNavProps {
  displayName: string;
  displayEmail: string;
  phone?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  avatarUrl?: string;
}

export default function CandidateSidebarNav({ displayName, displayEmail, phone, linkedinUrl, portfolioUrl, avatarUrl }: SidebarNavProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
          <SparklesIcon className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <span className="font-semibold text-sm text-white block leading-tight">
            AI Recruitment
          </span>
          <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
            Candidate
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
                  ? 'bg-emerald-500/15 text-emerald-300 font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }
              `}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-r-full" />
              )}
              <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'group-hover:text-emerald-400'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-800 mt-auto">
        <div className="flex items-center gap-2 px-2">
          <button onClick={() => setProfileOpen(true)} className="flex items-center gap-3 flex-1 min-w-0 rounded-lg hover:bg-slate-800/50 transition-all px-1.5 py-1.5 -ml-1.5 group">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-emerald-500/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex-shrink-0 ring-2 ring-emerald-500/20" />
            )}
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-medium text-white truncate group-hover:text-emerald-300 transition-colors">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
            </div>
          </button>
          <button onClick={() => setProfileOpen(true)} title="Editar perfil" className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all duration-150">
            <SettingsIcon className="w-3.5 h-3.5" />
          </button>
          <form action={signOut}>
            <button type="submit" title="Cerrar sesión" className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150">
              <LogOutIcon className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        initialPhone={phone ?? ''}
        initialLinkedinUrl={linkedinUrl ?? ''}
        initialPortfolioUrl={portfolioUrl ?? ''}
        initialAvatarUrl={avatarUrl ?? ''}
      />
    </>
  );
}
