import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/app/_actions/auth';
import {
  CalendarIcon,
  UserIcon,
  ClockIcon,
  VideoIcon,
  LinkIcon,
  StarIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  MessageSquareIcon,
} from 'lucide-react';
import { submitFeedback } from './feedback-action';
import FeedbackForm from './_components/FeedbackForm';

export const metadata: Metadata = {
  title: 'Feedback de entrevista | AI Recruitment Platform',
};

export const dynamic = 'force-dynamic';

const TYPE_LABELS: Record<string, string> = {
  phone_screen: 'Screening Telefónico',
  technical: 'Técnica',
  behavioral: 'Conductual',
  panel: 'Panel',
  final: 'Final',
};

function formatDateTime(iso: string, duration: number): string {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  };
  return d.toLocaleDateString('es-ES', opts).replace(/^\w/, (c) => c.toUpperCase()) + ` · ${duration} min`;
}

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createServerClient();
  const ctx = await getCurrentUserContext();
  if (!ctx) notFound();

  const { data: recruiter } = await supabase
    .from('recruiters')
    .select('id, full_name')
    .eq('email', ctx.email)
    .maybeSingle();

  if (!recruiter) notFound();

  const { data: interview } = await supabase
    .from('interviews')
    .select(`
      *,
      candidates ( full_name, email, phone, resume_url, ai_summary, seniority ),
      jobs ( title, department, location, remote_policy )
    `)
    .eq('id', id)
    .single();

  if (!interview) notFound();

  // Verify this interviewer is assigned
  const isAssigned = interview.interviewer_ids?.includes(recruiter.id);
  if (!isAssigned) notFound();

  const candidate = interview.candidates ?? {};
  const job = interview.jobs ?? {};
  const hasFeedback = !!interview.feedback;

  return (
    <div className="px-8 py-10 min-h-full">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
            <CalendarIcon className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {TYPE_LABELS[interview.interview_type] ?? interview.interview_type}
            </h1>
            <p className="text-sm text-slate-400">Feedback de entrevista</p>
          </div>
        </div>

        {/* Interview info */}
          <div className="rounded-xl border border-[#1e1e2a] bg-[#101016] p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-[#191922] flex items-center justify-center flex-shrink-0">
              <UserIcon className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{candidate.full_name ?? '—'}</h2>
              <p className="text-sm text-slate-400">{candidate.email ?? ''}</p>
              {candidate.phone && <p className="text-xs text-slate-500">{candidate.phone}</p>}
            </div>
          </div>

          <div className="h-px bg-[#1e1e2a]" />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Vacante</p>
              <p className="text-white font-medium">{job.title ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Departamento</p>
              <p className="text-white">{job.department ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Fecha y hora</p>
              <p className="text-white flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                {formatDateTime(interview.scheduled_at, interview.duration_minutes)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Seniority</p>
              <p className="text-white">{candidate.seniority ?? '—'}</p>
            </div>
          </div>

          {interview.meeting_url && (
            <a
              href={interview.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Unirse a Meet
            </a>
          )}
        </div>

        {/* Existing feedback display */}
        {hasFeedback && (
        <div className="rounded-xl border border-[#1e1e2a] bg-[#101016] p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
              Feedback enviado
            </h2>

            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Calificación</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={`w-5 h-5 ${star <= (interview.rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Resultado</p>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  interview.outcome === 'pass'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : interview.outcome === 'fail'
                    ? 'bg-red-500/20 text-red-300 border-red-500/30'
                    : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                }`}>
                  {interview.outcome === 'pass' ? 'Aprobado' : interview.outcome === 'fail' ? 'Rechazado' : 'Pendiente'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Notas</p>
              <p className="text-sm text-slate-300 bg-[#191922] rounded-lg px-4 py-3">{interview.feedback}</p>
            </div>

            {interview.feedback_submitted_at && (
              <p className="text-xs text-slate-600">
                Enviado el {new Date(interview.feedback_submitted_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
          </div>
        )}

        {/* Feedback form (only if not yet submitted) */}
        {!hasFeedback && (
          <FeedbackForm interviewId={id} />
        )}
      </div>
    </div>
  );
}
