import { useState } from 'react';
import { Star } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ratingApi } from '../../services/ratingApi';

interface Props {
  storyId: number;
  storyTitle: string;
  onDismiss: () => void;
}

export function RatingPrompt({ storyId, storyTitle, onDismiss }: Props) {
  const [hovered, setHovered]     = useState(0);
  const [selected, setSelected]   = useState(0);
  const [comment, setComment]     = useState('');
  const [submitted, setSubmitted] = useState(false);

  const qc = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: () => ratingApi.rateStory(storyId, selected, comment || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['story-rating', storyId] });
      setSubmitted(true);
      setTimeout(onDismiss, 1800);
    },
  });

  const displayRating = hovered || selected;

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  if (submitted) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-2xl px-8 py-6 text-center"
        style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)', animation: 'isv-fade 0.4s ease both' }}
      >
        <span className="text-3xl">⭐</span>
        <p className="text-sm font-semibold text-green-400">Thanks for rating!</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-4 rounded-2xl px-8 py-6 text-center"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', animation: 'isv-fade 0.4s 0.6s ease both', opacity: 0 }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Rate this story</p>
      <p className="text-sm font-medium text-white/70 max-w-xs truncate">{storyTitle}</p>

      {/* Stars */}
      <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onMouseEnter={() => setHovered(n)}
            onClick={() => setSelected(n)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className="h-7 w-7"
              style={{
                fill: n <= displayRating ? '#f59e0b' : 'transparent',
                color: n <= displayRating ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.1s',
              }}
            />
          </button>
        ))}
      </div>

      {displayRating > 0 && (
        <p className="text-xs font-semibold text-amber-400 -mt-1">
          {labels[displayRating]}
        </p>
      )}

      {selected > 0 && (
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Optional comment…"
          rows={2}
          maxLength={1000}
          className="w-full max-w-xs resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 placeholder:text-white/30 focus:border-white/20 focus:outline-none"
          style={{ animation: 'isv-fade 0.3s ease both' }}
        />
      )}

      <div className="flex gap-2">
        <button
          onClick={onDismiss}
          className="rounded-lg px-4 py-1.5 text-xs text-white/40 transition hover:text-white/60"
        >
          Skip
        </button>
        {selected > 0 && (
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="rounded-lg px-5 py-1.5 text-xs font-semibold text-slate-900 transition hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
          >
            {isPending ? 'Submitting…' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  );
}
