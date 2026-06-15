'use client';

/**
 * src/app/dashboard/jobs/[id]/_components/StageDropdown.tsx
 *
 * "Cambiar Etapa" popover dropdown.
 * Displays the current candidate status and lets the recruiter
 * move the candidate to any valid next stage.
 *
 * In Phase 1: only updates local state (passed via onStageChange callback).
 * In Phase 2: will call the candidates Server Action to persist to DB.
 */

import { useState, useRef, useEffect } from 'react';
import {
  ChevronDownIcon,
  PhoneIcon,
  CodeIcon,
  BrainIcon,
  ClipboardListIcon,
  BadgeCheckIcon,
  XCircleIcon,
  LogOutIcon,
} from 'lucide-react';
import type { CandidateStatus } from '@/types/database.types';

// ─────────────────────────────────────────────────────────────
// Stage definitions
// ─────────────────────────────────────────────────────────────

interface StageOption {
  value:   CandidateStatus;
  label:   string;
  icon:    React.ElementType;
  color:   string;      // Tailwind text color
  bg:      string;      // Tailwind bg color
  ring:    string;      // Tailwind ring color
}

const STAGE_OPTIONS: StageOption[] = [
  {
    value: 'screening',
    label: 'Screening',
    icon:  PhoneIcon,
    color: 'text-sky-300',
    bg:    'bg-sky-500/10',
    ring:  'ring-sky-500/30',
  },
  {
    value: 'interview',
    label: 'Entrevista',
    icon:  BrainIcon,
    color: 'text-brand-300',
    bg:    'bg-brand-500/10',
    ring:  'ring-brand-500/30',
  },
  {
    value: 'offer',
    label: 'Oferta',
    icon:  BadgeCheckIcon,
    color: 'text-emerald-300',
    bg:    'bg-emerald-500/10',
    ring:  'ring-emerald-500/30',
  },
  {
    value: 'hired',
    label: 'Contratado',
    icon:  ClipboardListIcon,
    color: 'text-teal-300',
    bg:    'bg-teal-500/10',
    ring:  'ring-teal-500/30',
  },
  {
    value: 'rejected',
    label: 'Descartado',
    icon:  XCircleIcon,
    color: 'text-red-300',
    bg:    'bg-red-500/10',
    ring:  'ring-red-500/30',
  },
  {
    value: 'withdrawn',
    label: 'Retirado',
    icon:  LogOutIcon,
    color: 'text-slate-400',
    bg:    'bg-slate-500/10',
    ring:  'ring-slate-500/30',
  },
];

// Helper to find a stage option by value
function findStage(value: CandidateStatus): StageOption {
  return (
    STAGE_OPTIONS.find((s) => s.value === value) ?? {
      value:  'new',
      label:  'Nuevo',
      icon:   CodeIcon,
      color:  'text-slate-300',
      bg:     'bg-[#262633]',
      ring:   'ring-slate-600/30',
    }
  );
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface StageDropdownProps {
  candidateId:   string;
  currentStatus: CandidateStatus;
  onStageChange: (candidateId: string, newStatus: CandidateStatus) => void;
}

export default function StageDropdown({
  candidateId,
  currentStatus,
  onStageChange,
}: StageDropdownProps) {
  const [isOpen, setIsOpen]       = useState(false);
  const containerRef              = useRef<HTMLDivElement>(null);
  const currentStage              = findStage(currentStatus);
  const CurrentIcon               = currentStage.icon;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  function handleSelect(stage: StageOption) {
    onStageChange(candidateId, stage.value);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`
          inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold
          ring-1 transition-colors duration-150
          ${currentStage.color} ${currentStage.bg} ${currentStage.ring}
        `}
      >
        <CurrentIcon className="w-3 h-3 flex-shrink-0" />
        {currentStage.label}
        <ChevronDownIcon
          className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Cambiar etapa del candidato"
          className="absolute right-0 top-full mt-2 z-30 w-48 rounded-xl bg-[#191922] border border-[#262633] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-3 py-2 border-b border-[#262633]">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Cambiar Etapa
            </p>
          </div>

          <ul className="py-1.5">
            {STAGE_OPTIONS.map((stage) => {
              const Icon      = stage.icon;
              const isCurrent = stage.value === currentStatus;

              return (
                <li key={stage.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isCurrent}
                    onClick={() => handleSelect(stage)}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left
                      transition-colors duration-100
                      ${isCurrent
                        ? `${stage.color} ${stage.bg} font-semibold`
                        : 'text-slate-400 hover:text-white hover:bg-[#262633]/50'
                      }
                    `}
                  >
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrent ? stage.color : ''}`} />
                    {stage.label}
                    {isCurrent && (
                      <span className="ml-auto text-[10px] text-slate-600">actual</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
