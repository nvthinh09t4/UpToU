import { useEffect, useState } from 'react';
import type { AnswerFeedback, CategoryScoreTypeDef } from '../../types/storyNode';

interface Props {
  feedback: AnswerFeedback | null;
  scoreTypeDefinitions: CategoryScoreTypeDef[];
  lang?: string;
}

export function AnswerFeedbackPopup({ feedback, scoreTypeDefinitions, lang = 'en' }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!feedback) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(t);
  }, [feedback]);

  if (!feedback || !visible) return null;

  const explanation = lang === 'vi' ? feedback.feedbackVi : feedback.feedback;

  const labelFor = (name: string) =>
    scoreTypeDefinitions.find((s) => s.name === name)?.label ?? name;

  const entries = Object.entries(feedback.scoreDeltas).filter(([, v]) => v !== 0);

  return (
    <div
      className="pointer-events-none absolute inset-x-4 bottom-4 z-50 rounded-xl p-4 shadow-2xl"
      style={{
        background: 'rgba(15,20,40,0.97)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(16px)',
        animation: 'feedback-pop 0.3s cubic-bezier(.4,0,.2,1) both',
      }}
    >
      <style>{`
        @keyframes feedback-pop {
          from { opacity:0; transform:translateY(12px) scale(0.97) }
          to   { opacity:1; transform:translateY(0) scale(1) }
        }
      `}</style>

      {/* Score delta chips */}
      {entries.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {entries.map(([name, delta]) => (
            <span
              key={name}
              className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{
                background: delta > 0 ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
                color: delta > 0 ? '#4ade80' : '#f87171',
                border: `1px solid ${delta > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}
            >
              {delta > 0 ? '+' : ''}{delta} {labelFor(name)}
            </span>
          ))}
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <p className="text-xs leading-relaxed text-white/70">{explanation}</p>
      )}
    </div>
  );
}
