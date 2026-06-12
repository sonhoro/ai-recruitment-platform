'use client';

/**
 * src/components/CVUpload.tsx
 *
 * Drag-and-drop CV uploader with full state machine UI.
 *
 * States:
 *   idle      → Initial prompt to drop or click
 *   dragging  → File is hovering over the drop zone (visual highlight)
 *   selected  → File chosen but form not yet submitted
 *   uploading → Fetch in progress (animated progress bar)
 *   success   → Upload complete; shows candidate info + simulated parse card
 *   error     → API returned an error (retry available)
 *
 * Props:
 *   jobId       string    — UUID of the job this candidate is applying for
 *   onSuccess   callback  — called with the full UploadSuccessResponse
 *   className   string?   — additional wrapper classes
 */

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type DragEvent,
  type ChangeEvent,
} from 'react';
import {
  UploadCloudIcon,
  FileTextIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
  XIcon,
  SparklesIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  TagIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
} from 'lucide-react';
import type { UploadState, UploadSuccessResponse } from '@/types/upload.types';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const MAX_SIZE_MB    = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ['application/pdf'];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

function isValidPdf(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Solo se permiten archivos PDF.';
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `El archivo supera el límite de ${MAX_SIZE_MB} MB.`;
  }
  if (file.size === 0) {
    return 'El archivo está vacío.';
  }
  return null; // valid
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

const INPUT_CLS =
  'w-full rounded-lg bg-slate-700/60 border border-slate-600/50 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors';

const LABEL_CLS = 'block text-xs font-medium text-slate-300 mb-1.5';

/** Animated progress bar */
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

/** Success card with simulated parsed skills */
function SuccessCard({ result }: { result: UploadSuccessResponse }) {
  const { candidate, parsing, resume_url } = result;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-400">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-xl bg-emerald-900/30 border border-emerald-700/40 px-4 py-3.5">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex-shrink-0">
          <CheckCircle2Icon className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-300">
            CV cargado exitosamente
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">
            El candidato ha sido registrado con estado{' '}
            <span className="font-medium text-emerald-500">En Procesamiento</span>.
          </p>
        </div>
        <a
          href={resume_url}
          target="_blank"
          rel="noopener noreferrer"
          title="Ver CV en nueva pestaña"
          className="ml-auto flex-shrink-0 text-emerald-500 hover:text-emerald-300 transition-colors"
        >
          <ExternalLinkIcon className="w-4 h-4" />
        </a>
      </div>

      {/* Candidate summary */}
      <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 divide-y divide-slate-700/40">
        {/* Candidate info */}
        <div className="px-4 py-3.5 flex flex-wrap gap-x-6 gap-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <UserIcon className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium">{candidate.full_name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <MailIcon className="w-3.5 h-3.5 text-slate-500" />
            {candidate.email}
          </div>
          {candidate.phone && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <PhoneIcon className="w-3.5 h-3.5 text-slate-500" />
              {candidate.phone}
            </div>
          )}
        </div>

        {/* Simulated AI skills */}
        <div className="px-4 py-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <SparklesIcon className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-semibold text-slate-300">
              Skills detectadas
            </span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Simulado · Fase 1
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {parsing.candidate_data.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs bg-violet-500/10 text-violet-300 border border-violet-500/20"
              >
                <TagIcon className="w-2.5 h-2.5" />
                {skill}
              </span>
            ))}
          </div>
          <p className="mt-2.5 text-xs text-slate-600 italic">
            {parsing.ai_note}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

interface CVUploadProps {
  jobId: string;
  onSuccess?: (result: UploadSuccessResponse) => void;
  className?: string;
}

export default function CVUpload({ jobId, onSuccess, className = '' }: CVUploadProps) {
  const fileInputRef       = useRef<HTMLInputElement>(null);
  const dragCounterRef     = useRef(0); // tracks nested drag enter/leave events
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Cleanup progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // ── File selection logic ───────────────────────────────────

  const selectFile = useCallback((file: File) => {
    const validationError = isValidPdf(file);
    if (validationError) {
      setUploadState({ status: 'error', message: validationError });
      return;
    }
    setUploadState({ status: 'selected', file });
    setFormError(null);
  }, []);

  // ── Drag & Drop handlers ───────────────────────────────────

  function onDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    dragCounterRef.current++;
    if (uploadState.status === 'idle' || uploadState.status === 'error') {
      setUploadState({ status: 'dragging' });
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); // required to allow drop
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setUploadState((prev) =>
        prev.status === 'dragging' ? { status: 'idle' } : prev,
      );
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    dragCounterRef.current = 0;
    const file = e.dataTransfer.files[0];
    if (file) selectFile(file);
  }

  // ── Click-to-browse ────────────────────────────────────────

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
    // Reset input so re-selecting the same file triggers onChange
    e.target.value = '';
  }

  // ── Upload submission ──────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (uploadState.status !== 'selected') return;

    // Client-side form validation
    if (!fullName.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Ingresa un correo electrónico válido.');
      return;
    }

    setFormError(null);

    // ── Animate a progress bar (fetch has no progress events)
    setUploadState({ status: 'uploading', progress: 0 });

    let simulatedProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      simulatedProgress = Math.min(simulatedProgress + Math.random() * 15, 88);
      setUploadState({ status: 'uploading', progress: Math.floor(simulatedProgress) });
    }, 200);

    // ── Build FormData ─────────────────────────────────────
    const formData = new FormData();
    formData.append('file',      uploadState.file);
    formData.append('job_id',    jobId);
    formData.append('full_name', fullName.trim());
    formData.append('email',     email.trim().toLowerCase());
    if (phone.trim()) formData.append('phone', phone.trim());
    formData.append('source', 'manual_upload');

    // ── POST to API Route ──────────────────────────────────
    try {
      const res = await fetch('/api/candidates/upload', {
        method: 'POST',
        body: formData,
      });

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Snap to 100% briefly before showing result
      setUploadState({ status: 'uploading', progress: 100 });
      await new Promise((r) => setTimeout(r, 400));

      const data = await res.json();

      if (!res.ok || !data.success) {
        setUploadState({
          status:  'error',
          message: data.error ?? 'Error desconocido. Intenta de nuevo.',
        });
        return;
      }

      const result = data as UploadSuccessResponse;
      setUploadState({ status: 'success', result });
      onSuccess?.(result);
    } catch (err) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      console.error('[CVUpload] fetch error:', err);
      setUploadState({
        status:  'error',
        message: 'Error de red. Verifica tu conexión e intenta de nuevo.',
      });
    }
  }

  // ── Reset everything ───────────────────────────────────────

  function reset() {
    setUploadState({ status: 'idle' });
    setFullName('');
    setEmail('');
    setPhone('');
    setFormError(null);
    dragCounterRef.current = 0;
  }

  // ─────────────────────────────────────────────────────────
  // Derived state
  // ─────────────────────────────────────────────────────────

  const { status } = uploadState;
  const isDragging  = status === 'dragging';
  const isUploading = status === 'uploading';
  const isSuccess   = status === 'success';
  const isError     = status === 'error';
  const isSelected  = status === 'selected';
  const isIdle      = status === 'idle';

  // ─────────────────────────────────────────────────────────
  // Render: Success state
  // ─────────────────────────────────────────────────────────

  if (isSuccess && uploadState.status === 'success') {
    return (
      <div className={`space-y-4 ${className}`}>
        <SuccessCard result={uploadState.result} />
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RefreshCwIcon className="w-3.5 h-3.5" />
          Subir otro CV
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Render: Upload form
  // ─────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${className}`} noValidate>

      {/* ── Drop zone ────────────────────────────────────── */}
      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        aria-label="Zona de carga de CV. Arrastra un PDF o haz clic para explorar."
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200 cursor-pointer select-none
          ${isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}
          ${isDragging
            ? 'border-violet-400 bg-violet-500/10 scale-[1.01] shadow-lg shadow-violet-500/10'
            : isSelected || isError
            ? 'border-slate-600 bg-slate-800/40'
            : 'border-slate-700 bg-slate-800/30 hover:border-violet-500/50 hover:bg-slate-800/50'
          }
        `}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={onFileInputChange}
          className="sr-only"
          disabled={isUploading}
          aria-hidden="true"
        />

        {/* ── Idle / Dragging state ── */}
        {(isIdle || isDragging) && (
          <>
            <div className={`flex items-center justify-center w-14 h-14 rounded-2xl border transition-all duration-200
              ${isDragging
                ? 'bg-violet-500/20 border-violet-400/50 scale-110'
                : 'bg-slate-700/60 border-slate-600/50'
              }`}
            >
              <UploadCloudIcon
                className={`w-6 h-6 transition-colors ${isDragging ? 'text-violet-300' : 'text-slate-400'}`}
              />
            </div>
            <div>
              <p className={`text-sm font-semibold transition-colors ${isDragging ? 'text-violet-200' : 'text-white'}`}>
                {isDragging ? 'Suelta el archivo aquí' : 'Arrastra el CV aquí'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                o{' '}
                <span className="text-violet-400 font-medium hover:text-violet-300 transition-colors">
                  haz clic para explorar
                </span>
                {' '}· Solo PDF · Máx {MAX_SIZE_MB} MB
              </p>
            </div>
          </>
        )}

        {/* ── Selected state ── */}
        {isSelected && uploadState.status === 'selected' && (
          <>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30">
              <FileTextIcon className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white truncate max-w-[260px]">
                {uploadState.file.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatBytes(uploadState.file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="Quitar archivo seleccionado"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {/* ── Uploading state ── */}
        {isUploading && uploadState.status === 'uploading' && (
          <div className="w-full max-w-xs space-y-3">
            <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Loader2Icon className="w-6 h-6 text-violet-400 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-white">Subiendo CV...</p>
            <ProgressBar value={uploadState.progress} />
            <p className="text-xs text-slate-500">{uploadState.progress}%</p>
          </div>
        )}

        {/* ── Error state (inline in drop zone) ── */}
        {isError && uploadState.status === 'error' && (
          <>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/25">
              <XCircleIcon className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-300">Error al subir</p>
              <p className="text-xs text-red-500 mt-1 max-w-[260px]">
                {uploadState.message}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCwIcon className="w-3 h-3" />
              Intentar de nuevo
            </button>
          </>
        )}
      </div>

      {/* ── Candidate info fields (visible only when file is selected) ── */}
      {isSelected && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Información del candidato
          </p>

          {/* Name */}
          <div>
            <label htmlFor="cv-full-name" className={LABEL_CLS}>
              Nombre completo <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                id="cv-full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nombre Apellido"
                required
                disabled={isUploading}
                className={`${INPUT_CLS} pl-10`}
              />
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cv-email" className={LABEL_CLS}>
                Correo electrónico <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="cv-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  disabled={isUploading}
                  className={`${INPUT_CLS} pl-10`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="cv-phone" className={LABEL_CLS}>
                Teléfono
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="cv-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  disabled={isUploading}
                  className={`${INPUT_CLS} pl-10`}
                />
              </div>
            </div>
          </div>

          {/* Form-level validation error */}
          {formError && (
            <p className="flex items-center gap-2 text-xs text-red-400">
              <XCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />
              {formError}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isUploading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-violet-500/20"
          >
            <UploadCloudIcon className="w-4 h-4" />
            Subir CV y registrar candidato
          </button>
        </div>
      )}
    </form>
  );
}
