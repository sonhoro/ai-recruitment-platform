'use client';

import { useTransition, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LoaderIcon,
  XIcon,
} from 'lucide-react';

interface UploadCvFormProps {
  email: string;
  fullName: string;
  jobId: string;
  existingCvName?: string;
}

export default function UploadCvForm({ email, fullName, jobId, existingCvName }: UploadCvFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf'))) {
      setFile(droppedFile);
      setMessage(null);
    } else {
      setMessage({ type: 'error', text: 'Solo se aceptan archivos PDF.' });
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setMessage(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', email);
      formData.append('full_name', fullName);
      if (jobId) formData.append('job_id', jobId);

      try {
        const res = await fetch('/api/candidates/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (res.ok) {
          setFile(null);
          if (inputRef.current) inputRef.current.value = '';

          if (jobId) {
            router.push('/candidate/applications');
          } else {
            setMessage({ type: 'success', text: 'CV subido correctamente.' });
            router.refresh();
          }
        } else {
          setMessage({ type: 'error', text: data.error ?? 'Error al subir el CV.' });
        }
      } catch {
        setMessage({ type: 'error', text: 'Error de conexión. Intenta de nuevo.' });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* CV state notification */}
      {existingCvName ? (
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
          <AlertCircleIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">
            Tienes un CV guardado: <span className="font-medium text-amber-200">{existingCvName}</span>. ¿Deseas modificarlo?
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 px-4 py-3">
          <AlertCircleIcon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-400">
            No tienes un CV subido todavía. Sube tu currículum en formato PDF para poder postularte a las vacantes.
          </p>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all
          ${dragOver
            ? 'border-emerald-400 bg-emerald-500/10'
            : file
              ? 'border-emerald-600/50 bg-slate-800/50'
              : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <FileTextIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <XIcon className="w-3 h-3" />
              Eliminar archivo
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
              <UploadIcon className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <p className="text-sm text-slate-300">
                <span className="text-emerald-400 font-semibold">Haz clic</span> o arrastra tu CV aquí
              </p>
              <p className="text-xs text-slate-600 mt-1">PDF solamente</p>
            </div>
          </div>
        )}
      </div>

      {/* Info notice */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {email && fullName ? (
            <>Subiendo como <span className="text-slate-200 font-medium">{fullName}</span> &lt;{email}&gt;</>
          ) : (
            <>La información se extraerá automáticamente de tu CV después de la carga.</>
          )}
          {jobId ? (
            <> &middot; Se creará una postulación</>
          ) : (
            <> &middot; <a href="/candidate/jobs" className="text-emerald-400 hover:text-emerald-300 underline">Explora vacantes</a> para postularte</>
          )}
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 ${
          message.type === 'success'
            ? 'border-emerald-500/20 bg-emerald-500/10'
            : 'border-red-500/20 bg-red-500/10'
        }`}>
          {message.type === 'success'
            ? <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            : <AlertCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          }
          <p className={`text-sm ${message.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!file || isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <LoaderIcon className="w-4 h-4 animate-spin" />
            Subiendo…
          </>
        ) : (
          <>
            <UploadIcon className="w-4 h-4" />
            Subir CV
          </>
        )}
      </button>
    </form>
  );
}
