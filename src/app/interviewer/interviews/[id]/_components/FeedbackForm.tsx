'use client';

import { useTransition, useState } from 'react';
import { StarIcon, LoaderIcon, SendIcon, AlertCircleIcon } from 'lucide-react';
import { submitFeedback } from '../feedback-action';

export default function FeedbackForm({ interviewId }: { interviewId: string }) {
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('Selecciona una calificación.');
      return;
    }

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await submitFeedback(interviewId, formData);
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6">
      <h2 className="text-base font-bold text-white flex items-center gap-2">
        <StarIcon className="w-5 h-5 text-amber-400" />
        Enviar feedback
      </h2>

      {/* Rating */}
      <div className="space-y-2">
        <label className="text-xs text-slate-500 uppercase tracking-wider">Calificación</label>
        <input type="hidden" name="rating" value={rating} />
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setRating(star)}
              className="p-1 transition-transform hover:scale-110"
            >
              <StarIcon
                className={`w-8 h-8 transition-colors ${
                  star <= (hoveredStar || rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-700'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Outcome */}
      <div className="space-y-2">
        <label className="text-xs text-slate-500 uppercase tracking-wider">Resultado</label>
        <div className="flex gap-3">
          {[
            { value: 'pass', label: 'Aprobado', classes: 'border-emerald-600 text-emerald-300 peer-checked:bg-emerald-600/20 peer-checked:border-emerald-400' },
            { value: 'fail', label: 'Rechazado', classes: 'border-red-600 text-red-300 peer-checked:bg-red-600/20 peer-checked:border-red-400' },
            { value: 'pending', label: 'Pendiente', classes: 'border-slate-600 text-slate-300 peer-checked:bg-slate-600/20 peer-checked:border-slate-400' },
          ].map((opt) => (
            <label key={opt.value} className="flex-1">
              <input type="radio" name="outcome" value={opt.value} defaultChecked={opt.value === 'pending'} className="peer sr-only" />
              <span className={`block text-center py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${opt.classes}`}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Feedback text */}
      <div className="space-y-2">
        <label htmlFor="feedback" className="text-xs text-slate-500 uppercase tracking-wider">
          Notas de la entrevista
        </label>
        <textarea
          id="feedback"
          name="feedback"
          rows={5}
          required
          minLength={10}
          placeholder="Describe cómo fue la entrevista, fortalezas, áreas de oportunidad…"
          className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 px-4 text-sm text-slate-100 placeholder-slate-600 transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 resize-none"
          disabled={isPending}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-3">
          <AlertCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 px-4 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <LoaderIcon className="w-4 h-4 animate-spin" />
            Enviando…
          </>
        ) : (
          <>
            <SendIcon className="w-4 h-4" />
            Enviar feedback
          </>
        )}
      </button>
    </form>
  );
}
