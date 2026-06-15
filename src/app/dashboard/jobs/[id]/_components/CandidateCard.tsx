'use client';

/**
 * src/app/dashboard/jobs/[id]/_components/CandidateCard.tsx
 *
 * A single candidate row in the ranking list.
 *
 * Layout (collapsed):
 *   [Rank] [Avatar] [Name + Role + Location] [Seniority] [Score] [Stage] [Expand]
 *
 * Accordion (expanded):
 *   AI Summary · Strengths · Weaknesses · Skills · Observability meta
 *
 * Props:
 *   candidate     CandidateWithScore
 *   rank          number (1-based position)
 *   isOpen        boolean (accordion state, controlled externally)
 *   onToggle      () => void
 *   onStageChange (id, status) => void
 */

import {
  ChevronDownIcon,
  MapPinIcon,
  BriefcaseIcon,
  CheckIcon,
  XIcon,
  TagIcon,
  SparklesIcon,
  ExternalLinkIcon,
  ClockIcon,
  ZapIcon,
} from 'lucide-react';
import type { CandidateStatus } from '@/types/database.types';
import type { CandidateWithScore, SeniorityLevel } from '../_data/mock';
import { ScorePill } from './ScoreBadge';
import StageDropdown from './StageDropdown';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

const AVATAR_GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-sky-500 to-cyan-600',
  'from-fuchsia-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
];

function getAvatarGradient(id: string): string {
  const index = id.charCodeAt(id.length - 1) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

// ─────────────────────────────────────────────────────────────
// Rank medal
// ─────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-400/15 border border-amber-400/30 text-base">
        🥇
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-400/15 border border-slate-400/30 text-base">
        🥈
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/15 border border-amber-700/30 text-base">
        🥉
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#191922] border border-[#262633] text-xs font-bold text-slate-500">
      {rank}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AI Recommendation badge
// ─────────────────────────────────────────────────────────────

const RECOMMENDATION_STYLES: Record<string, string> = {
  advance:   'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  interview: 'bg-brand-500/10 text-brand-300 border-brand-500/20',
  test:      'bg-amber-500/15 text-amber-300 border-amber-500/30',
  hold:      'bg-sky-500/15 text-sky-300 border-sky-500/30',
  discard:   'bg-red-500/15 text-red-300 border-red-500/30',
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  advance:   'AI: Avanzar',
  interview: 'AI: Entrevista',
  test:      'AI: Test',
  hold:      'AI: Hold',
  discard:   'AI: Descartar',
}

function AiRecommendationBadge({ recommendation }: { recommendation: string | null }) {
  if (!recommendation) return null
  const label = RECOMMENDATION_LABELS[recommendation]
  const style = RECOMMENDATION_STYLES[recommendation]
  if (!label || !style) return null
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Seniority badge
// ─────────────────────────────────────────────────────────────

const SENIORITY_STYLES: Record<SeniorityLevel, string> = {
  Junior:      'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/25',
  'Semi-Senior': 'bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/25',
  Senior:      'bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/25',
};

function SeniorityBadge({ level }: { level: SeniorityLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${SENIORITY_STYLES[level]}`}
    >
      {level}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

interface CandidateCardProps {
  candidate:     CandidateWithScore;
  rank:          number;
  isOpen:        boolean;
  onToggle:      () => void;
  onStageChange: (id: string, status: CandidateStatus) => void;
}

export default function CandidateCard({
  candidate,
  rank,
  isOpen,
  onToggle,
  onStageChange,
}: CandidateCardProps) {
  const gradient = getAvatarGradient(candidate.id);

  return (
    <article
      className={`rounded-xl border transition-all duration-200 overflow-hidden
        ${isOpen
          ? 'border-brand-500/30 bg-[#191922]'
          : 'border-[#262633] bg-[#191922] hover:border-[#262633] hover:bg-[#191922]'
        }
      `}
    >
      {/* ── Collapsed header row ───────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-4 sm:gap-4">

        {/* Rank */}
        <div className="flex-shrink-0">
          <RankBadge rank={rank} />
        </div>

        {/* Avatar */}
        <div
          className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-brand-500 text-white text-sm font-bold select-none"
          aria-hidden="true"
        >
          {getInitials(candidate.full_name)}
        </div>

        {/* Name + role + location */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white truncate">
              {candidate.full_name}
            </span>
            <SeniorityBadge level={candidate.seniority} />
            <AiRecommendationBadge recommendation={candidate.ai_recommendation} />
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-slate-500 truncate">
              <BriefcaseIcon className="w-3 h-3 flex-shrink-0" />
              {candidate.current_role}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-600">
              <MapPinIcon className="w-3 h-3 flex-shrink-0" />
              {candidate.location}
            </span>
          </div>
        </div>

        {/* Score pill */}
        <div className="flex-shrink-0 hidden sm:block">
          <ScorePill score={candidate.score} />
        </div>

        {/* Stage dropdown */}
        <div className="flex-shrink-0 hidden md:block">
          <StageDropdown
            candidateId={candidate.id}
            currentStatus={candidate.status}
            onStageChange={onStageChange}
          />
        </div>

        {/* Expand / collapse toggle */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={
            isOpen
              ? `Colapsar resumen de ${candidate.full_name}`
              : `Ver resumen de IA de ${candidate.full_name}`
          }
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-brand-300 hover:bg-brand-500/10 border border-transparent hover:border-brand-500/20 transition-all duration-150"
        >
          <SparklesIcon className="w-3 h-3" />
          <span className="hidden sm:inline">
            {isOpen ? 'Ocultar' : 'Perfil IA'}
          </span>
          <ChevronDownIcon
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Mobile: score + stage visible below name */}
      <div className="flex items-center gap-3 px-4 pb-3 sm:hidden">
        <ScorePill score={candidate.score} />
        <StageDropdown
          candidateId={candidate.id}
          currentStatus={candidate.status}
          onStageChange={onStageChange}
        />
      </div>

      {/* ── Accordion: AI Profile Summary ─────────────────── */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}
        `}
        aria-hidden={!isOpen}
      >
        <div className="border-t border-[#262633] px-4 py-5 space-y-5">

          {/* AI Summary */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="w-3.5 h-3.5 text-brand-400" />
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Resumen de Perfil · IA
              </h4>
              {candidate.resume_url && candidate.resume_url !== '#' && (
                <a
                  href={candidate.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-brand-400 transition-colors"
                >
                  <ExternalLinkIcon className="w-3 h-3" />
                  Ver CV
                </a>
              )}
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {candidate.ai_summary}
            </p>
          </div>

          {/* Reasoning */}
          <div className="rounded-xl bg-[#101016]/60 border border-[#262633] px-4 py-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">
              Razonamiento del modelo
            </p>
            <p className="text-xs text-slate-400 leading-relaxed italic">
              "{candidate.reasoning}"
            </p>
          </div>

          {/* Strengths + Weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Strengths */}
            <div>
              <p className="text-xs font-semibold text-emerald-500 mb-2 flex items-center gap-1.5">
                <CheckIcon className="w-3.5 h-3.5" />
                Fortalezas
              </p>
              <ul className="space-y-1.5">
                {candidate.strengths.map((strength, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-slate-400"
                  >
                    <CheckIcon className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div>
              <p className="text-xs font-semibold text-red-500 mb-2 flex items-center gap-1.5">
                <XIcon className="w-3.5 h-3.5" />
                Áreas de mejora
              </p>
              <ul className="space-y-1.5">
                {candidate.weaknesses.map((weakness, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-slate-400"
                  >
                    <XIcon className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
              <TagIcon className="w-3 h-3" />
              Skills detectadas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-[#262633] text-slate-300 border border-slate-600/50"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* LLM observability meta */}
          <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-[#262633]">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
              <ZapIcon className="w-3 h-3" />
              <span className="font-medium">{candidate.model_version}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-600">
              <ClockIcon className="w-3 h-3" />
              {candidate.latency_ms} ms
            </div>
            <div className="text-[10px] text-slate-600">
              {candidate.prompt_tokens + candidate.completion_tokens} tokens totales
            </div>
            <div className="text-[10px] text-slate-600 ml-auto">
              Aplicó el {formatDate(candidate.applied_at)}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
