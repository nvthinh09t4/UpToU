import type { AnswerFeedback, CategoryScoreTypeDef } from '../../types/storyNode';

interface Props {
  feedback: AnswerFeedback;
  scoreTypeDefinitions: CategoryScoreTypeDef[];
  lang?: string;
}

export function ScoreDeltaNotification({ feedback, scoreTypeDefinitions, lang }: Props) {
  const entries = Object.entries(feedback.scoreDeltas).filter(([, v]) => v !== 0);
  const labelFor = (name: string) =>
    scoreTypeDefinitions.find((s) => s.name === name)?.label ?? name;

  const choicePct =
    feedback.totalChoices > 0
      ? Math.round((feedback.choiceCount / feedback.totalChoices) * 100)
      : null;

  const feedbackText = lang === 'vi' ? (feedback.feedbackVi ?? feedback.feedback) : feedback.feedback;

  if (entries.length === 0 && !feedbackText) return null;

  return (
    <div
      className="flex-shrink-0 border-b px-5 py-3"
      style={{
        borderColor: 'rgba(255,255,255,0.07)',
        background: '#080c14',
        animation: 'delta-drop 0.3s cubic-bezier(.4,0,.2,1) both',
      }}
    >
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {entries.map(([name, delta]) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold"
              style={{
                background: delta > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                color: delta > 0 ? '#4ade80' : '#f87171',
                border: `1px solid ${delta > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}
            >
              <span className="text-white/50">{labelFor(name)}</span>
              <span>{delta > 0 ? '+' : ''}{delta}</span>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        {feedbackText && (
          <p className="text-sm leading-relaxed text-white/55">{feedbackText}</p>
        )}
        {choicePct !== null && (
          <span className="ml-auto flex-shrink-0 text-xs tabular-nums text-white/30">
            {choicePct}% chose this
          </span>
        )}
      </div>
    </div>
  );
}
