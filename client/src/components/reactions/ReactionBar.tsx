import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reactionApi } from '../../services/reactionApi';
import { useAuthStore } from '../../store/authStore';
import type { ReactionType } from '../../types/reaction';

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'Like', emoji: '👍', label: 'Like' },
  { type: 'Love', emoji: '❤️', label: 'Love' },
  { type: 'Laugh', emoji: '😂', label: 'Laugh' },
];

interface ReactionBarProps {
  storyId: number;
}

export function ReactionBar({ storyId }: ReactionBarProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  const { data: summary } = useQuery({
    queryKey: ['reactions', storyId],
    queryFn: () => reactionApi.getByStory(storyId),
  });

  const { mutate: react } = useMutation({
    mutationFn: (type: ReactionType) => reactionApi.upsert(storyId, type),
    onSuccess: (updated) => {
      queryClient.setQueryData(['reactions', storyId], updated);
    },
  });

  const counts: Record<ReactionType, number> = {
    Like: summary?.likeCount ?? 0,
    Love: summary?.loveCount ?? 0,
    Laugh: summary?.laughCount ?? 0,
  };

  return (
    <div className="flex items-center gap-2 py-4">
      {REACTIONS.map(({ type, emoji, label }) => {
        const isActive = summary?.currentUserReaction === type;
        const count = counts[type];
        return (
          <button
            key={type}
            title={isAuthenticated ? label : 'Sign in to react'}
            onClick={() => isAuthenticated && react(type)}
            className={[
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
              isAuthenticated ? 'cursor-pointer hover:scale-105' : 'cursor-default opacity-60',
              isActive
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:border-primary/50',
            ].join(' ')}
          >
            <span className="text-base leading-none">{emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
