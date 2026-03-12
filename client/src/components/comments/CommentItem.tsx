import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Trash2 } from 'lucide-react';
import { commentApi } from '../../services/commentApi';
import { voteApi } from '../../services/voteApi';
import { useAuthStore } from '../../store/authStore';
import { CommentForm } from './CommentForm';
import { VoteButtons } from '../votes/VoteButtons';
import { replaceEmoticons } from './emoticons';
import type { Comment } from '../../types/comment';
import type { VoteResult } from '../../types/vote';

// Indent up to this depth, then stop growing to avoid overflow
const MAX_VISUAL_DEPTH = 4;

interface CommentItemProps {
  comment: Comment;
  storyId: number;
  depth?: number;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function highlightMentions(body: string): React.ReactNode {
  // First convert emoticon shortcuts to emoji characters
  const withEmoji = replaceEmoticons(body);
  const parts = withEmoji.split(/(@[\w.]+)/g);
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="text-primary font-medium">{part}</span>
      : part
  );
}

export function CommentItem({ comment, storyId, depth = 0 }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [voteData, setVoteData] = useState<VoteResult>({
    upvoteCount: comment.upvoteCount,
    downvoteCount: comment.downvoteCount,
    currentUserVote: comment.currentUserVote,
  });

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  const isOwn = user?.id === comment.author.id;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const canDelete = isOwn || isAdmin;

  const { mutate: deleteComment } = useMutation({
    mutationFn: () => commentApi.delete(storyId, comment.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', storyId] }),
  });

  // Pre-fill @mention of the person being replied to
  const replyPrefix = comment.author.mentionHandle
    ? `@${comment.author.mentionHandle} `
    : `@${comment.author.name.replace(/\s+/g, '').toLowerCase()} `;

  async function handleReply(body: string) {
    await commentApi.post({ storyId, body, parentCommentId: comment.id });
    queryClient.invalidateQueries({ queryKey: ['comments', storyId] });
    setShowReply(false);
  }

  const indented = depth > 0 && depth <= MAX_VISUAL_DEPTH;
  const flatDeep = depth > MAX_VISUAL_DEPTH;

  return (
    <div
      id={`comment-${comment.id}`}
      className={[
        indented ? 'ml-6 border-l border-border pl-4' : '',
        flatDeep ? 'border-l border-border pl-4' : '',
      ].join(' ')}
    >
      <div className="py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {comment.author.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-foreground">{comment.author.name}</span>
              {comment.author.mentionHandle && (
                <span className="ml-1.5 text-xs text-muted-foreground">@{comment.author.mentionHandle}</span>
              )}
              <span className="ml-2 text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
              {comment.editedAt && <span className="ml-1 text-xs text-muted-foreground italic">(edited)</span>}
            </div>
          </div>

          {canDelete && (
            <button
              onClick={() => deleteComment()}
              title="Delete comment"
              className="flex-shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <p className="mt-2 text-sm text-foreground leading-relaxed">{highlightMentions(comment.body)}</p>

        <div className="mt-1.5 flex items-center gap-3">
          <VoteButtons
            upvoteCount={voteData.upvoteCount}
            downvoteCount={voteData.downvoteCount}
            currentUserVote={voteData.currentUserVote}
            onVote={(type) => voteApi.voteComment(storyId, comment.id, type)}
            onVoteSuccess={setVoteData}
          />

          {isAuthenticated && (
            <button
              onClick={() => setShowReply((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Reply
            </button>
          )}
        </div>

        {showReply && (
          <div className="mt-3">
            <CommentForm
              storyId={storyId}
              parentCommentId={comment.id}
              placeholder={`Reply to ${comment.author.name}…`}
              initialValue={replyPrefix}
              onSubmit={handleReply}
              onCancel={() => setShowReply(false)}
              autoFocus
            />
          </div>
        )}
      </div>

      {comment.replies.map((reply) => (
        <CommentItem key={reply.id} comment={reply} storyId={storyId} depth={depth + 1} />
      ))}
    </div>
  );
}
