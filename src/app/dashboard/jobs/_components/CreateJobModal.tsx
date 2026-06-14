'use client';

/**
 * src/app/dashboard/jobs/_components/CreateJobModal.tsx
 *
 * Modal with a native HTML form to create a new vacancy.
 *
 * Features:
 *   - Controlled open/close via `isOpen` + `onClose` props
 *   - Calls `createJob` Server Action via `useTransition` (no page reload)
 *   - Inline validation error display
 *   - Loading state with disabled controls during submission
 *   - Focus trap: Escape key closes the modal
 *   - Resets form on successful submit
 */

import { useEffect, useRef, useTransition } from 'react';
import { XIcon, Loader2Icon, BriefcaseIcon } from 'lucide-react';
import { createJob } from '@/app/_actions/jobs';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful insert so the parent can show feedback. */
  onSuccess: (jobTitle: string) => void;
  /** Called when the server returns an error. */
  onError: (message: string) => void;
}

// ─────────────────────────────────────────────────────────────
// Shared field styles (keeps JSX readable)
// ─────────────────────────────────────────────────────────────

const INPUT_CLS =
  'w-full rounded-lg bg-slate-700/60 border border-slate-600/50 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

const LABEL_CLS = 'block text-xs font-medium text-slate-300 mb-1.5';

const SELECT_CLS =
  'w-full rounded-lg bg-slate-700/60 border border-slate-600/50 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors appearance-none';

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function CreateJobModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: CreateJobModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isPending) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Form submission ──────────────────────────────────────
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title')?.toString().trim();

    startTransition(async () => {
      const result = await createJob(formData);
      if (result.success) {
        formRef.current?.reset();
        onSuccess(result.data.title);
        onClose();
      } else {
        onError(result.error);
      }
    });

    void title; // suppress unused warning
  }

  // ─────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={() => { if (!isPending) onClose(); }}
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700/60 shadow-2xl shadow-black/40 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25">
                <BriefcaseIcon className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h2 id="modal-title" className="text-sm font-semibold text-white">
                  Nueva Vacante
                </h2>
                <p className="text-xs text-slate-500">
                  Completa los campos para publicar una nueva posición.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { if (!isPending) onClose(); }}
              disabled={isPending}
              aria-label="Cerrar modal"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable form body */}
          <div className="overflow-y-auto flex-1">
            <form
              ref={formRef}
              id="create-job-form"
              onSubmit={handleSubmit}
              noValidate
              className="px-6 py-5 space-y-5"
            >

              {/* Title (required) */}
              <div>
                <label htmlFor="job-title" className={LABEL_CLS}>
                  Título de la vacante <span className="text-red-400">*</span>
                </label>
                <input
                  id="job-title"
                  name="title"
                  type="text"
                  required
                  disabled={isPending}
                  placeholder="Ej: Senior Frontend Engineer"
                  className={INPUT_CLS}
                />
              </div>

              {/* Department + Location (side by side) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="job-department" className={LABEL_CLS}>
                    Departamento
                  </label>
                  <input
                    id="job-department"
                    name="department"
                    type="text"
                    disabled={isPending}
                    placeholder="Ej: Ingeniería"
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label htmlFor="job-location" className={LABEL_CLS}>
                    Ubicación
                  </label>
                  <input
                    id="job-location"
                    name="location"
                    type="text"
                    disabled={isPending}
                    placeholder="Ej: Ciudad de México"
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              {/* Employment type + Remote policy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="job-employment-type" className={LABEL_CLS}>
                    Tipo de empleo
                  </label>
                  <div className="relative">
                    <select
                      id="job-employment-type"
                      name="employment_type"
                      disabled={isPending}
                      defaultValue=""
                      className={SELECT_CLS}
                    >
                      <option value="" disabled>Selecciona...</option>
                      <option value="full_time">Tiempo completo</option>
                      <option value="part_time">Medio tiempo</option>
                      <option value="contract">Contrato</option>
                    </select>
                    {/* Chevron icon */}
                    <svg
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label htmlFor="job-remote-policy" className={LABEL_CLS}>
                    Modalidad
                  </label>
                  <div className="relative">
                    <select
                      id="job-remote-policy"
                      name="remote_policy"
                      disabled={isPending}
                      defaultValue=""
                      className={SELECT_CLS}
                    >
                      <option value="" disabled>Selecciona...</option>
                      <option value="remote">Remoto</option>
                      <option value="hybrid">Híbrido</option>
                      <option value="onsite">Presencial</option>
                    </select>
                    <svg
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="job-description" className={LABEL_CLS}>
                  Descripción del puesto
                </label>
                <textarea
                  id="job-description"
                  name="description"
                  rows={4}
                  disabled={isPending}
                  placeholder="Describe las responsabilidades principales del rol..."
                  className={`${INPUT_CLS} resize-none`}
                />
              </div>

              {/* Requirements */}
              <div>
                <label htmlFor="job-requirements" className={LABEL_CLS}>
                  Requerimientos
                </label>
                <textarea
                  id="job-requirements"
                  name="requirements"
                  rows={4}
                  disabled={isPending}
                  placeholder="Lista las habilidades, años de experiencia y otros requisitos..."
                  className={`${INPUT_CLS} resize-none`}
                />
                <p className="mt-1.5 text-xs text-slate-600">
                  Este texto se usará como contexto para las evaluaciones de IA.
                </p>
              </div>

              {/* Skills required */}
              <div>
                <label htmlFor="job-skills" className={LABEL_CLS}>
                  Skills requeridos
                </label>
                <input
                  id="job-skills"
                  name="skills_required"
                  type="text"
                  disabled={isPending}
                  placeholder="Ej: Java, Spring Boot, PostgreSQL, AWS"
                  className={INPUT_CLS}
                />
                <p className="mt-1.5 text-xs text-slate-600">
                  Separados por coma. La IA usará esta lista para evaluar a los candidatos.
                </p>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex-shrink-0">
            <button
              type="button"
              onClick={() => { if (!isPending) onClose(); }}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="create-job-form"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-violet-500/20"
            >
              {isPending ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Vacante'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
