import { useMutation } from '@tanstack/react-query';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import type { VoteResult, VoteType } from '../../types/vote';

interface VoteButtonsProps {
  upvoteCount: number;
  downvoteCount: number;
  currentUserVote: string | null;
  onVote: (voteType: VoteType) => Promise<VoteResult>;
  onVoteSuccess: (result: VoteResult) => void;
  size?: 'sm' | 'md';
}

export function VoteButtons({
  upvoteCount,
  downvoteCount,
  currentUserVote,
  onVote,
  onVoteSuccess,
  size = 'sm',
}: VoteButtonsProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { mutate: vote } = useMutation({
    mutationFn: (type: VoteType) => onVote(type),
    onSuccess: onVoteSuccess,
  });

  const iconClass = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  const btnBase = 'flex items-center gap-1 rounded px-2 py-1 text-sm font-medium transition-colors';
  const disabledClass = 'cursor-default opacity-50';

  return (
    <div className="flex items-center gap-1">
      <button
        title={isAuthenticated ? 'Upvote' : 'Sign in to vote'}
        onClick={() => isAuthenticated && vote('Up')}
        className={[
          btnBase,
          isAuthenticated ? 'cursor-pointer hover:bg-accent' : disabledClass,
          currentUserVote === 'Up' ? 'text-green-600' : 'text-muted-foreground',
        ].join(' ')}
      >
        <ThumbsUp className={iconClass} />
        {upvoteCount > 0 && <span>{upvoteCount}</span>}
      </button>

      <button
        title={isAuthenticated ? 'Downvote' : 'Sign in to vote'}
        onClick={() => isAuthenticated && vote('Down')}
        className={[
          btnBase,
          isAuthenticated ? 'cursor-pointer hover:bg-accent' : disabledClass,
          currentUserVote === 'Down' ? 'text-red-500' : 'text-muted-foreground',
        ].join(' ')}
      >
        <ThumbsDown className={iconClass} />
        {downvoteCount > 0 && <span>{downvoteCount}</span>}
      </button>
    </div>
  );
}
