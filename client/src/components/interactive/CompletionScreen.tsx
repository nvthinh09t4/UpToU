import { useState } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';
import type { CategoryScoreTypeDef } from '../../types/storyNode';
import { RatingPrompt } from '../story/RatingPrompt';

// ── Score stat card ────────────────────────────────────────────────────────────

function ScoreStatCard({ label, finalValue, delay }: { label: string; finalValue: number; delay: number }) {
  const animated = useCountUp(finalValue, 1500, delay);
  const done   = animated === finalValue;
  const isPos  = finalValue > 0;
  const color  = isPos ? '#4ade80' : '#f87171';
  const bg     = isPos ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)';
  const bdr    = isPos ? 'rgba(34,197,94,0.30)'  : 'rgba(239,68,68,0.30)';
  const glow   = isPos ? 'rgba(34,197,94,0.22)'  : 'rgba(239,68,68,0.22)';

  return (
    <div
      className="flex flex-col items-center rounded-2xl px-4 py-5"
      style={{
        background: bg, border: `1px solid ${bdr}`,
        boxShadow: done ? `0 0 24px ${glow}` : 'none',
        transition: 'box-shadow 0.4s ease',
        animation: `isv-fade 0.4s ${(delay / 1000).toFixed(2)}s ease both`, opacity: 0,
      }}
    >
      <span className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: `${color}bb` }}>
        {label}
      </span>
      <span className="text-sm font-bold tabular-nums leading-none" style={{ color: 'rgba(255,255,255,0.25)', textDecoration: 'line-through', textDecorationColor: 'rgba(255,255,255,0.15)' }}>
        0
      </span>
      <span className="my-1 text-xs font-bold text-white/20">↓</span>
      <span
        className="text-4xl font-black tabular-nums leading-none"
        style={{ color, textShadow: done ? `0 0 22px ${glow}` : 'none', transition: 'text-shadow 0.4s ease' }}
      >
        {animated > 0 ? '+' : ''}{animated}
      </span>
      <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-white/25">total earned</span>
    </div>
  );
}

// ── Completion screen ──────────────────────────────────────────────────────────

interface Props {
  totalPointsEarned: number;
  storyTitle: string;
  scoreTotals: Record<string, number>;
  scoreTypeDefinitions: CategoryScoreTypeDef[];
  onClose: () => void;
  storyId?: number;
}

export function CompletionScreen({ totalPointsEarned, storyTitle, scoreTotals, scoreTypeDefinitions, onClose, storyId }: Props) {
  const [ratingDismissed, setRatingDismissed] = useState(false);

  const scoreEntries = scoreTypeDefinitions
    .filter((st) => (scoreTotals[st.name] ?? 0) !== 0)
    .map((st) => ({ name: st.name, label: st.label ?? st.name, value: scoreTotals[st.name] ?? 0 }));

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-8 py-12 text-center"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #1e1b4b 0%, #0a0a12 70%)', animation: 'isv-fade 0.6s ease both' }}
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: 'rgba(251,191,36,0.25)', transform: 'scale(1.5)' }} />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 ring-2 ring-amber-400/40">
          <Trophy className="h-9 w-9 text-amber-400" />
        </div>
      </div>

      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/40">Story complete</p>
      <h2 className="mb-1 text-2xl font-bold text-white">{storyTitle}</h2>
      <p className="mb-8 text-base text-white/50">Your choices shaped this story.</p>

      {scoreEntries.length > 0 && (
        <div className="mb-6 w-full max-w-sm" style={{ animation: 'isv-fade 0.5s 0.2s ease both', opacity: 0 }}>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/35">Final scores</p>
          <div className={`grid gap-3 ${scoreEntries.length === 1 ? 'grid-cols-1' : scoreEntries.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {scoreEntries.map((entry, i) => (
              <ScoreStatCard
                key={entry.name}
                label={entry.label}
                finalValue={entry.value}
                delay={300 + i * 150}
              />
            ))}
          </div>
        </div>
      )}

      {totalPointsEarned > 0 && (
        <div className="mb-8 flex items-center gap-4 rounded-2xl px-8 py-5" style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', animation: 'isv-fade 0.5s 0.4s ease both', opacity: 0 }}>
          <Sparkles className="h-7 w-7 text-amber-400" />
          <div className="text-left">
            <p className="text-sm text-amber-400/70">Credits earned</p>
            <p className="text-3xl font-extrabold text-amber-400">+{totalPointsEarned.toLocaleString()}</p>
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="rounded-xl px-10 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', animation: 'isv-fade 0.5s 0.5s ease both', opacity: 0 }}
      >
        Back to Story
      </button>

      {storyId != null && !ratingDismissed && (
        <div className="mt-4 w-full max-w-sm">
          <RatingPrompt storyId={storyId} storyTitle={storyTitle} onDismiss={() => setRatingDismissed(true)} />
        </div>
      )}
    </div>
  );
}
