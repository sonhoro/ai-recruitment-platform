'use client';

import { useState, useTransition } from 'react';
import {
  UserIcon,
  CalendarIcon,
  LinkIcon,
  CheckCircleIcon,
  SaveIcon,
  XIcon,
} from 'lucide-react';
import { updateInterview, getRecruiters, completeInterview, sendInterviewInvitation } from '@/app/_actions/interviews';

// ─── Shared type ──────────────────────────────────────────────────────────────

export interface InterviewItem {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  department: string;
  interview_type: string;
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  interviewer: string;
  recruiter_id: string | null;
  score: number;
  seniority: string;
  meet_link: string | null;
}

// ─── Helpers (shared with server page) ────────────────────────────────────────

export const TYPE_CONFIG: Record<
  string,
  { label: string; classes: string }
> = {
  phone_screen: {
    label: 'Screening Telefónico',
    classes: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  },
  technical: {
    label: 'Técnica',
    classes: 'bg-brand-500/10 text-brand-300 border border-brand-500/20',
  },
  behavioral: {
    label: 'Conductual',
    classes: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  },
  panel: {
    label: 'Panel',
    classes: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  },
  final: {
    label: 'Final',
    classes: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; classes: string }
> = {
  por_programar: {
    label: 'Por programar',
    classes: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  },
  scheduled: {
    label: 'Programada',
    classes: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  },
  completed: {
    label: 'Completada',
    classes: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  },
};

const SENIORITY_COLORS: Record<string, string> = {
  Junior: 'bg-teal-500/20 text-teal-300',
  'Semi-Senior': 'bg-blue-500/20 text-blue-300',
  Senior: 'bg-purple-500/20 text-purple-300',
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 85
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : score >= 70
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : 'bg-red-500/20 text-red-300 border-red-500/30';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      ★ {score}
    </span>
  );
}

function formatDateTime(iso: string, duration: number): string {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString('es-ES', { month: 'short' });
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day} ${month.charAt(0).toUpperCase() + month.slice(1)} · ${time} · ${duration} min`;
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface InterviewCardClientProps {
  interview: InterviewItem;
  isUpcoming: boolean;
}

export default function InterviewCardClient({
  interview,
  isUpcoming,
}: InterviewCardClientProps) {
  const [editing, setEditing] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(interview.scheduled_at);
  const [interviewerName, setInterviewerName] = useState(interview.interviewer);
  const [recruiters, setRecruiters] = useState<{ id: string; full_name: string }[]>([]);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState(interview.recruiter_id ?? '');
  const [meetLink, setMeetLink] = useState(interview.meet_link ?? '');
  const [invitationSent, setInvitationSent] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeComment, setCompleteComment] = useState('');
  const [isPending, startTransition] = useTransition();

  const typeCfg = TYPE_CONFIG[interview.interview_type] ?? TYPE_CONFIG.technical;
  const statusCfg = STATUS_CONFIG[interview.status] ?? STATUS_CONFIG.scheduled;
  const seniorityCls = SENIORITY_COLORS[interview.seniority] ?? 'bg-slate-500/20 text-slate-300';

  async function handleEdit() {
    const list = await getRecruiters();
    setRecruiters(list);
    setEditing(true);
  }

  function handleCancel() {
    setScheduledAt(interview.scheduled_at);
    setInterviewerName(interview.interviewer);
    setSelectedRecruiterId(interview.recruiter_id ?? '');
    setMeetLink(interview.meet_link ?? '');
    setInvitationSent(false);
    setEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateInterview(interview.id, {
        scheduled_at: scheduledAt !== interview.scheduled_at ? new Date(scheduledAt).toISOString() : undefined,
        recruiter_id: selectedRecruiterId !== interview.recruiter_id ? selectedRecruiterId : undefined,
        meeting_url: meetLink !== (interview.meet_link ?? '') ? (meetLink || null) : undefined,
      });

      if (result.success && meetLink) {
        const inviteResult = await sendInterviewInvitation({
          candidate_name: interview.candidate_name,
          candidate_email: interview.candidate_email,
          job_title: interview.job_title,
          scheduled_at: scheduledAt,
          duration_minutes: interview.duration_minutes,
          meeting_url: meetLink,
          interviewer: interviewerName,
        });
        if (inviteResult.sent) setInvitationSent(true);
      }

      setEditing(false);
    });
  }

  function handleRecruiterChange(recruiterId: string) {
    setSelectedRecruiterId(recruiterId);
    const recruiter = recruiters.find((r) => r.id === recruiterId);
    if (recruiter) {
      setInterviewerName(recruiter.full_name);
    }
  }

  return (
    <div className="relative flex flex-col gap-4 rounded-xl bg-[#101016] border border-[#1e1e2a] p-5 hover:border-brand-500/30 transition-colors">
      {/* Top row: type chip + status */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeCfg.classes}`}>
          {typeCfg.label}
        </span>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.classes}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Candidate name + seniority + score */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold text-white leading-tight">
            {interview.candidate_name}
          </h3>
          <span className={`self-start px-2 py-0.5 rounded-full text-xs font-medium ${seniorityCls}`}>
            {interview.seniority}
          </span>
        </div>
        <ScoreBadge score={interview.score} />
      </div>

      {/* Vacancy + department */}
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-slate-200">{interview.job_title}</p>
        <p className="text-xs text-slate-500">{interview.department}</p>
      </div>

      {/* Interviewer - editable */}
      <div className="flex items-center gap-2 text-slate-400 text-xs">
        <UserIcon className="h-3.5 w-3.5 flex-shrink-0" />
        {editing ? (
          <select
            value={selectedRecruiterId}
            onChange={(e) => handleRecruiterChange(e.target.value)}
            className="flex-1 rounded-lg border border-[#262633] bg-[#191922] px-2.5 py-1.5 text-xs text-slate-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
            disabled={isPending}
          >
            <option value="">Seleccionar encargado...</option>
            {recruiters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.full_name}
              </option>
            ))}
          </select>
        ) : (
          <span>{interviewerName}</span>
        )}
      </div>

      {/* Date/time - editable */}
      <div className="flex items-center gap-2 text-slate-400 text-xs">
        <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
        {editing ? (
          <input
            type="datetime-local"
            value={toDatetimeLocal(scheduledAt)}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="flex-1 rounded-lg border border-[#262633] bg-[#191922] px-2.5 py-1.5 text-xs text-slate-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
            disabled={isPending}
          />
        ) : (
          <span>{formatDateTime(interview.scheduled_at, interview.duration_minutes)}</span>
        )}
      </div>

      {/* Meet link - editable */}
      <div className="flex items-center gap-2 text-slate-400 text-xs">
        <LinkIcon className="h-3.5 w-3.5 flex-shrink-0" />
        {editing ? (
          <input
            type="url"
            value={meetLink}
            onChange={(e) => setMeetLink(e.target.value)}
            placeholder="https://meet.google.com/..."
            className="flex-1 rounded-lg border border-[#262633] bg-[#191922] px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
            disabled={isPending}
          />
        ) : interview.meet_link ? (
          <a
            href={interview.meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate text-brand-400 hover:text-brand-300 underline underline-offset-2"
          >
            {interview.meet_link}
          </a>
        ) : (
          <span className="text-slate-600">No asignado</span>
        )}
      </div>

      {invitationSent && (
        <p className="text-xs text-emerald-400 flex items-center gap-1">
          <CheckCircleIcon className="h-3 w-3" />
          Invitación enviada al candidato
        </p>
      )}

      {/* Divider */}
      <div className="h-px bg-[#1e1e2a]" />

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {interview.meet_link ? (
          <a
            href={interview.meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Unirse a Meet
          </a>
        ) : (
          <button
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#191922] text-slate-600 text-xs font-medium cursor-not-allowed"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Unirse a Meet
          </button>
        )}

        {editing ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              <SaveIcon className="h-3.5 w-3.5" />
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#262633] hover:border-[#262633] text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
            >
              <XIcon className="h-3.5 w-3.5" />
              Cancelar
            </button>
          </>
        ) : (
          <>
            {isUpcoming && (
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#262633] hover:border-[#262633] text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Editar
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCompleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-700 hover:border-emerald-600 text-emerald-400 hover:text-emerald-200 text-xs font-medium transition-colors"
            >
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Marcar Completada
            </button>
          </>
        )}
      </div>

      {/* ── Complete modal ── */}
      {showCompleteModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setShowCompleteModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl bg-[#101016] border border-[#1e1e2a] p-6">
              <h3 className="text-base font-bold text-white mb-1">
                Completar entrevista
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                {interview.candidate_name} — {interview.job_title}
              </p>

              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Comentario (opcional)
              </label>
              <textarea
                value={completeComment}
                onChange={(e) => setCompleteComment(e.target.value)}
                rows={4}
                placeholder="Resultado de la entrevista, observaciones..."
                className="w-full rounded-lg border border-[#262633] bg-[#191922] px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none"
                disabled={isPending}
              />

              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowCompleteModal(false);
                    setCompleteComment('');
                  }}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg border border-[#262633] hover:border-[#262633] text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    startTransition(async () => {
                      await completeInterview(
                        interview.id,
                        completeComment.trim() || undefined,
                      );
                      setShowCompleteModal(false);
                      setCompleteComment('');
                    });
                  }}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  {isPending ? 'Completando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
