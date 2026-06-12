'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { applyToJob } from '@/app/_actions/candidates';
import {
  FileTextIcon,
  UploadIcon,
  XIcon,
  LoaderIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ArrowRightIcon,
} from 'lucide-react';

interface ApplyModalProps {
  jobId: string;
  jobTitle: string;
  mainResumeName: string;
  mainResumeUrl: string;
  onClose: () => void;
}

export default function ApplyModal({
  jobId,
  jobTitle,
  mainResumeName,
  mainResumeUrl,
  onClose,
}: ApplyModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'confirm' | 'uploading' | 'done' | 'error'>('confirm');
  const [message, setMessage] = useState('');
  const [useCustomCv, setUseCustomCv] = useState(false);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleApply() {
    setStep('uploading');

    if (useCustomCv && customFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', customFile);
      formData.append('email', '');
      formData.append('full_name', '');
      formData.append('job_id', jobId);

      try {
        const res = await fetch('/api/candidates/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if (res.ok) {
          setStep('done');
          setMessage('CV subido y postulación creada correctamente.');
        } else {
          setStep('error');
          setMessage(data.error ?? 'Error al subir el CV.');
        }
      } catch {
        setStep('error');
        setMessage('Error de conexión. Intenta de nuevo.');
      } finally {
        setUploading(false);
      }
      return;
    }

    const result = await applyToJob(jobId, mainResumeUrl);

    if ('error' in result) {
      setStep('error');
      setMessage(result.error);
    } else {
      setStep('done');
      setMessage(result.updated ? 'CV actualizado en tu postulación existente.' : 'Postulación creada correctamente.');
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type === 'application/pdf' || selected.name.endsWith('.pdf')) {
        setCustomFile(selected);
        setMessage('');
      } else {
        setMessage('Solo se aceptan archivos PDF.');
      }
    }
  }

  function getResumeName(url: string): string {
    if (!url) return '';
    const parts = url.split('/');
    const last = parts[parts.length - 1];
    return last ? decodeURIComponent(last) : '';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Postularme</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-slate-300">
            Te vas a postular a <span className="font-semibold text-white">{jobTitle}</span>
          </p>

          {step === 'confirm' && (
            <>
              {/* Current CV info */}
              {mainResumeUrl ? (
                <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <FileTextIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {getResumeName(mainResumeUrl)}
                      </p>
                      <p className="text-xs text-slate-500">CV principal</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                  <p className="text-sm text-amber-300">
                    No tienes un CV guardado. Sube uno para postularte.
                  </p>
                </div>
              )}

              {/* Option: use different CV */}
              <div>
                {mainResumeUrl && (
                  <button
                    type="button"
                    onClick={() => setUseCustomCv(!useCustomCv)}
                    className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline"
                  >
                    {useCustomCv ? 'Usar CV principal' : '¿Quieres usar un CV diferente para esta postulación?'}
                  </button>
                )}

                {(useCustomCv || !mainResumeUrl) && (
                  <div className="mt-3">
                    <div
                      onClick={() => inputRef.current?.click()}
                      className="cursor-pointer rounded-xl border-2 border-dashed border-slate-700 p-6 text-center hover:border-emerald-500/50 transition-colors"
                    >
                      <input
                        ref={inputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      {customFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <FileTextIcon className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-slate-300">{customFile.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <UploadIcon className="w-6 h-6 text-slate-500" />
                          <p className="text-sm text-slate-400">
                            <span className="text-emerald-400 font-semibold">Haz clic</span> para subir otro PDF
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {message && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5">
                  <AlertCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">{message}</p>
                </div>
              )}
            </>
          )}

          {step === 'uploading' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <LoaderIcon className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-sm text-slate-400">
                {uploading ? 'Subiendo CV...' : 'Creando postulación...'}
              </p>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircleIcon className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-sm text-slate-300 text-center">{message}</p>
            </div>
          )}

          {step === 'error' && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5">
              <AlertCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          {(step === 'confirm' || step === 'error') && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                disabled={!mainResumeUrl && !customFile}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {useCustomCv ? 'Subir y postularme' : 'Postularme'}
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </>
          )}
          {step === 'done' && (
            <button
              onClick={() => { router.push('/candidate/applications'); router.refresh(); }}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
            >
              Ver mis postulaciones
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
