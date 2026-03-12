import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { commentApi } from '../../services/commentApi';
import { useAuthStore } from '../../store/authStore';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';

const SORT_OPTIONS = [
  { value: 'Newest', label: 'Newest' },
  { value: 'Oldest', label: 'Oldest' },
  { value: 'MostUpvoted', label: 'Most Upvoted' },
  { value: 'MostDownvoted', label: 'Most Downvoted' },
];

interface CommentListProps {
  storyId: number;
}

export function CommentList({ storyId }: CommentListProps) {
  const [sortBy, setSortBy] = useState('Newest');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', storyId, sortBy],
    queryFn: () => commentApi.getByStory(storyId, sortBy),
  });

  const { mutateAsync: postComment } = useMutation({
    mutationFn: (body: string) => commentApi.post({ storyId, body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', storyId] }),
  });

  const total = comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);

  return (
    <section className="mt-12 border-t pt-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <MessageSquare className="h-5 w-5 text-primary" />
          {total > 0 ? `${total} Comment${total === 1 ? '' : 's'}` : 'Comments'}
        </h2>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {isAuthenticated ? (
        <div className="mb-8">
          <CommentForm storyId={storyId} onSubmit={(body) => postComment(body).then(() => {})} />
        </div>
      ) : (
        <p className="mb-8 text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          {' '}to leave a comment.
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
      ) : (
        <div className="divide-y divide-border">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} storyId={storyId} />
          ))}
        </div>
      )}
    </section>
  );
}
