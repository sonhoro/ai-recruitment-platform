'use client';

/**
 * src/app/dashboard/jobs/[id]/_components/ScoreBadge.tsx
 *
 * Color-coded score indicator.
 *   ≥ 80  → Emerald (green)   — Excelente
 *   50–79 → Amber  (yellow)   — Moderado
 *   < 50  → Red               — Bajo
 *
 * Renders a circular ring with the numeric score inside,
 * plus a small label below.
 */

interface ScoreBadgeProps {
  score: number; // 0 – 100
  size?: 'sm' | 'md';
}

type ScoreTier = 'high' | 'mid' | 'low';

function getTier(score: number): ScoreTier {
  if (score >= 80) return 'high';
  if (score >= 50) return 'mid';
  return 'low';
}

const TIER_STYLES: Record<
  ScoreTier,
  {
    ring: string;
    text: string;
    bg: string;
    label: string;
    labelColor: string;
  }
> = {
  high: {
    ring:       'ring-emerald-500/30',
    text:       'text-emerald-300',
    bg:         'bg-emerald-500/10',
    label:      'Excelente',
    labelColor: 'text-emerald-500',
  },
  mid: {
    ring:       'ring-amber-500/30',
    text:       'text-amber-300',
    bg:         'bg-amber-500/10',
    label:      'Moderado',
    labelColor: 'text-amber-500',
  },
  low: {
    ring:       'ring-red-500/30',
    text:       'text-red-300',
    bg:         'bg-red-500/10',
    label:      'Bajo',
    labelColor: 'text-red-500',
  },
};

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const tier   = getTier(score);
  const styles = TIER_STYLES[tier];

  const isSmall = size === 'sm';

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`
          flex items-center justify-center rounded-full font-bold ring-1
          ${styles.ring} ${styles.text} ${styles.bg}
          ${isSmall ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base'}
        `}
      >
        {score}
      </div>
      <span className={`text-[10px] font-semibold ${styles.labelColor}`}>
        {styles.label}
      </span>
    </div>
  );
}

/** Compact inline pill variant for use inside tables or tight layouts. */
export function ScorePill({ score }: { score: number }) {
  const tier   = getTier(score);
  const styles = TIER_STYLES[tier];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full px-3 py-1
        text-xs font-bold ring-1
        ${styles.ring} ${styles.text} ${styles.bg}
      `}
    >
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full
          ${tier === 'high' ? 'bg-emerald-400' : tier === 'mid' ? 'bg-amber-400' : 'bg-red-400'}
        `}
      />
      {score}
    </span>
  );
}
