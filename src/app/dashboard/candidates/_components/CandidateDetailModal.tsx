'use client';

import { useEffect } from 'react';
import { XIcon, MailIcon, PhoneIcon, SparklesIcon, TagIcon, MapPinIcon, BriefcaseIcon, ExternalLinkIcon } from 'lucide-react';

interface CandidateDetail {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  ai_summary: string | null;
  skills: string[];
  job_title: string;
  location: string | null;
  resume_url?: string | null;
}

interface CandidateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateDetail | null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
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

export default function CandidateDetailModal({
  isOpen,
  onClose,
  candidate,
}: CandidateDetailModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !candidate) return null;

  const gradient = getAvatarGradient(candidate.id);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-detail-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700/60 shadow-2xl shadow-black/40 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${gradient} text-white text-sm font-bold select-none`}
              >
                {getInitials(candidate.full_name)}
              </div>
              <div>
                <h2 id="candidate-detail-title" className="text-sm font-semibold text-white">
                  {candidate.full_name}
                </h2>
                <p className="text-xs text-slate-500">
                  {candidate.job_title || 'Candidato'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MailIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <a
                  href={`mailto:${candidate.email}`}
                  className="text-violet-400 hover:text-violet-300 transition-colors truncate"
                >
                  {candidate.email}
                </a>
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <PhoneIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <a
                    href={`tel:${candidate.phone}`}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    {candidate.phone}
                  </a>
                </div>
              )}
              {candidate.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPinIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-300">{candidate.location}</span>
                </div>
              )}
              {candidate.job_title && (
                <div className="flex items-center gap-3 text-sm">
                  <BriefcaseIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-300">{candidate.job_title}</span>
                </div>
              )}
            </div>

            {/* Professional Summary */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Resumen Profesional
                </h3>
                {candidate.resume_url && (
                  <a
                    href={candidate.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-violet-400 transition-colors"
                  >
                    <ExternalLinkIcon className="w-3 h-3" />
                    Ver CV
                  </a>
                )}
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                {candidate.ai_summary || 'Aún no hay resumen disponible. El candidato está siendo procesado por el pipeline de IA.'}
              </p>
            </div>

            {/* Skills */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TagIcon className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Habilidades y Tecnologías
                </h3>
              </div>
              {candidate.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs bg-slate-700/60 text-slate-300 border border-slate-600/50"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No hay habilidades registradas aún.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
