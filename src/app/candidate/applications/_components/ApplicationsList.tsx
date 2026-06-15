'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  BriefcaseIcon,
  BuildingIcon,
  MapPinIcon,
  ClockIcon,
  StarIcon,
  FileTextIcon,
  XIcon,
  UploadIcon,
  LoaderIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from 'lucide-react';

interface ApplicationJob {
  title: string;
  department: string | null;
  location: string | null;
  remote_policy: string | null;
}

interface Application {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  status: string;
  applied_at: string;
  ai_summary: string | null;
  resume_url: string | null;
  score: number | null;
  jobs: ApplicationJob;
}

interface ApplicationsListProps {
  applications: Application[];
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  screening: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  interview: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  offer: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  hired: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
  withdrawn: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo',
  screening: 'En revisión',
  interview: 'Entrevista',
  offer: 'Oferta',
  hired: 'Contratado',
  rejected: 'Rechazado',
  withdrawn: 'Retirado',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] ?? 'bg-slate-500/20 text-slate-400'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function CvViewerModal({ resumeUrl, onClose }: { resumeUrl: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-3xl h-[85vh] rounded-xl bg-[#101016] border border-[#262633] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2a]">
          <h3 className="text-sm font-medium text-white">Vista previa del CV</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <embed src={resumeUrl} type="application/pdf" className="flex-1 w-full" />
      </div>
    </div>
  );
}

function UploadCvModal({
  jobId,
  email,
  fullName,
  onClose,
  onSuccess,
}: {
  jobId: string;
  email: string;
  fullName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_id', jobId);
    formData.append('email', email);
    formData.append('full_name', fullName);

    try {
      const res = await fetch('/api/candidates/upload', { method: 'POST', body: formData });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Error al subir el CV.');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-xl bg-[#101016] border border-[#262633] p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Actualizar CV</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f && (f.type === 'application/pdf' || f.name.endsWith('.pdf'))) {
              setFile(f);
              setError('');
            } else {
              setError('Solo se aceptan archivos PDF.');
            }
          }}
          onClick={() => inputRef.current?.click()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
            dragOver ? 'border-emerald-400 bg-emerald-500/10' : 'border-[#262633] bg-[#191922] hover:border-slate-600'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setFile(f); setError(''); }
            }}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileTextIcon className="w-8 h-8 text-emerald-400" />
              <p className="text-sm text-white">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <UploadIcon className="w-8 h-8 text-slate-500" />
              <p className="text-sm text-slate-400">
                <span className="text-emerald-400 font-semibold">Haz clic</span> o arrastra tu CV aquí
              </p>
              <p className="text-xs text-slate-600">PDF solamente</p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5">
            <AlertCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <><LoaderIcon className="w-4 h-4 animate-spin" /> Subiendo...</>
          ) : (
            <><UploadIcon className="w-4 h-4" /> Subir CV</>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ApplicationsList({ applications }: ApplicationsListProps) {
  const router = useRouter();
  const [viewCvUrl, setViewCvUrl] = useState<string | null>(null);
  const [updateApp, setUpdateApp] = useState<Application | null>(null);

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  return (
    <>
      <div className="space-y-3">
        {applications.map((app) => {
          const job = app.jobs ?? {} as ApplicationJob;

          return (
            <div
              key={app.id}
              className="rounded-xl border border-[#1e1e2a] bg-[#101016] p-5 hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{job.title ?? 'Vacante'}</h3>
                  <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <BuildingIcon className="w-3.5 h-3.5" />
                    {job.department ?? 'Sin departamento'}
                    {job.location && (
                      <>
                        <span className="text-slate-600">·</span>
                        <MapPinIcon className="w-3.5 h-3.5" />
                        {job.location}
                      </>
                    )}
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </div>

              {app.ai_summary && (
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">{app.ai_summary}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5" />
                  Postulado {formatDate(app.applied_at)}
                </span>
                {app.score != null && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <StarIcon className="w-3.5 h-3.5" />
                    Score IA: {Math.round(app.score)}/100
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4">
                {app.resume_url && (
                  <button
                    onClick={() => setViewCvUrl(app.resume_url!)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#191922] hover:bg-[#262633] text-slate-300 text-xs font-medium transition-colors"
                  >
                    <FileTextIcon className="w-3.5 h-3.5" />
                    Ver CV
                  </button>
                )}
                <button
                  onClick={() => setUpdateApp(app)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                >
                  <FileTextIcon className="w-3.5 h-3.5" />
                  Actualizar CV
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {viewCvUrl && (
        <CvViewerModal
          resumeUrl={viewCvUrl}
          onClose={() => setViewCvUrl(null)}
        />
      )}

      {updateApp && (
        <UploadCvModal
          jobId={updateApp.job_id}
          email={updateApp.email}
          fullName={updateApp.full_name}
          onClose={() => setUpdateApp(null)}
          onSuccess={() => {
            setUpdateApp(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
