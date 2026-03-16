import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { CategoryScoreTypeDef } from '../../types/storyNode';

interface Props {
  scoreTotals: Record<string, number>;
  scoreTypeDefinitions: CategoryScoreTypeDef[];
}

export function ScoreProgressPanel({ scoreTotals, scoreTypeDefinitions }: Props) {
  const [open, setOpen] = useState(false);

  if (scoreTypeDefinitions.length === 0) return null;

  const maxScore = Math.max(
    ...scoreTypeDefinitions.map((st) => Math.abs(scoreTotals[st.name] ?? 0)),
    1
  );

  return (
    <div
      className="border-t"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(8,10,20,0.92)' }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2 text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/35">
          Score breakdown
        </span>
        <ChevronDown
          className="h-3.5 w-3.5 text-white/30 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div className="space-y-2 px-4 pb-3">
          {scoreTypeDefinitions.map((st) => {
            const value = scoreTotals[st.name] ?? 0;
            const pct = Math.min(100, Math.max(0, ((value + maxScore) / (maxScore * 2)) * 100));
            return (
              <div key={st.name}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] text-white/50">{st.label ?? st.name}</span>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: value >= 0 ? '#4ade80' : '#f87171' }}
                  >
                    {value >= 0 ? '+' : ''}{value}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: value >= 0
                        ? 'linear-gradient(90deg,#22d3ee,#4ade80)'
                        : 'linear-gradient(90deg,#f87171,#fb923c)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
