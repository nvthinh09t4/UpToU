import { useEffect, useRef, useState } from 'react';
import { ChevronRight, CheckSquare, Dice5, Loader2 } from 'lucide-react';
import type { PlayerStoryNode, PlayerAnswer } from '../../types/storyNode';

interface Ripple { id: number; x: number; y: number; }

interface Props {
  node: PlayerStoryNode;
  onAnswer: (answer: PlayerAnswer, rect: DOMRect) => void;
  submitting: boolean;
  confirmMode: boolean;
  lang?: string;
}

export function AnswerPanel({ node, onAnswer, submitting, confirmMode, lang }: Props) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<PlayerAnswer | null>(null);
  const [ripples, setRipples] = useState<Record<number, Ripple>>({});
  const rippleCounter = useRef(0);
  const selectedRectRef = useRef<DOMRect | null>(null);

  useEffect(() => { setSelectedAnswer(null); }, [node.id]);

  function triggerRipple(e: React.MouseEvent<HTMLButtonElement>, answerId: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = ++rippleCounter.current;
    setRipples((prev) => ({ ...prev, [answerId]: { id, x, y } }));
    setTimeout(() => setRipples((prev) => { const n = { ...prev }; delete n[answerId]; return n; }), 600);
  }

  function handleClick(e: React.MouseEvent<HTMLButtonElement>, answer: PlayerAnswer) {
    if (submitting) return;
    triggerRipple(e, answer.id);
    if (confirmMode) {
      setSelectedAnswer((prev) => prev?.id === answer.id ? null : answer);
      selectedRectRef.current = e.currentTarget.getBoundingClientRect();
    } else {
      onAnswer(answer, e.currentTarget.getBoundingClientRect());
    }
  }

  function handleConfirm() {
    if (selectedAnswer && !submitting && selectedRectRef.current)
      onAnswer(selectedAnswer, selectedRectRef.current);
  }

  return (
    <div
      className="flex flex-shrink-0 flex-col gap-2.5 px-5 pb-6 pt-4"
      style={{ background: '#080c14', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p className="mb-0.5 text-xs font-bold uppercase tracking-[0.18em] text-white/30">
        What do you do?
      </p>

      {node.answers.map((answer, idx) => {
        const accent     = answer.color ?? '#6366f1';
        const isSelected = selectedAnswer?.id === answer.id;
        const isHovered  = hoveredId === answer.id;
        const isDimmed   = confirmMode && selectedAnswer !== null && !isSelected;
        const ripple     = ripples[answer.id];

        return (
          <button
            key={answer.id}
            onClick={(e) => handleClick(e, answer)}
            onMouseEnter={() => setHoveredId(answer.id)}
            onMouseLeave={() => setHoveredId(null)}
            disabled={submitting}
            className="group relative flex w-full items-center gap-4 overflow-hidden rounded-xl text-left disabled:pointer-events-none"
            style={{
              background: isSelected ? `${accent}18` : isHovered ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isSelected ? `${accent}55` : isHovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}`,
              transform: isSelected || isHovered ? 'translateX(5px) scale(1.005)' : 'translateX(0) scale(1)',
              boxShadow: isSelected
                ? `0 0 0 1px ${accent}44, inset 4px 0 0 ${accent}, 0 0 16px ${accent}22`
                : isHovered ? `0 0 0 1px ${accent}44, inset 4px 0 0 ${accent}`
                : `inset 4px 0 0 ${accent}55`,
              padding: '13px 16px',
              opacity: isDimmed ? 0.4 : 1,
              transition: 'all 0.18s ease',
              animation: 'answer-in 0.4s cubic-bezier(.4,0,.2,1) both',
              animationDelay: `${idx * 70}ms`,
            }}
          >
            {ripple && (
              <span
                key={ripple.id}
                className="pointer-events-none absolute rounded-full"
                style={{
                  left: `${ripple.x}%`, top: `${ripple.y}%`,
                  width: '8px', height: '8px', marginLeft: '-4px', marginTop: '-4px',
                  background: `${accent}55`, animation: 'ripple-out 0.6s ease-out both',
                }}
              />
            )}

            <span
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-all duration-150"
              style={{
                background: isSelected || isHovered ? accent : `${accent}28`,
                color: isSelected || isHovered ? '#fff' : accent,
                boxShadow: isSelected ? `0 0 14px ${accent}70` : isHovered ? `0 0 12px ${accent}60` : 'none',
              }}
            >
              {idx + 1}
            </span>

            <span className="flex-1 text-base font-medium leading-snug text-white/85 transition-colors group-hover:text-white">
              {lang === 'vi' ? (answer.textVi ?? answer.text) : answer.text}
            </span>

            <div className="flex flex-shrink-0 items-center gap-2">
              {answer.hasBranching && (
                <span title="Outcome is randomized">
                  <Dice5 className="h-4 w-4 text-indigo-400/60" />
                </span>
              )}
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin text-white/40" />
              ) : isSelected ? (
                <CheckSquare className="h-4 w-4 text-white/70" />
              ) : (
                <ChevronRight className="h-4 w-4 text-white/20 transition-all group-hover:translate-x-1 group-hover:text-white/70" />
              )}
            </div>
          </button>
        );
      })}

      {confirmMode && (
        <button
          onClick={handleConfirm}
          disabled={!selectedAnswer || submitting}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30"
          style={{
            background: selectedAnswer
              ? 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)'
              : 'rgba(255,255,255,0.06)',
            boxShadow: selectedAnswer ? '0 0 20px rgba(99,102,241,0.4)' : 'none',
          }}
        >
          {submitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
            : <><ChevronRight className="h-4 w-4" /> Confirm Choice</>}
        </button>
      )}
    </div>
  );
}
