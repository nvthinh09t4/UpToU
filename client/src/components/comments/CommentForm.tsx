import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../services/userApi';
import { Button } from '../ui/button';
import type { UserMention } from '../../types/notification';

interface CommentFormProps {
  storyId: number;
  parentCommentId?: number;
  placeholder?: string;
  initialValue?: string;
  onSubmit: (body: string) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({
  placeholder = 'Write a comment… Use @handle to mention someone.',
  initialValue = '',
  onSubmit,
  onCancel,
  autoFocus = false,
}: CommentFormProps) {
  const [body, setBody] = useState(initialValue);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: mentionResults = [] } = useQuery({
    queryKey: ['user-search', mentionQuery],
    queryFn: () => userApi.searchMentions(mentionQuery!),
    enabled: mentionQuery !== null && mentionQuery.length > 0,
    staleTime: 10_000,
  });

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setBody(val);

    // Detect @mention at cursor
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/@([\w.]*)$/);
    setMentionQuery(match ? match[1] : null);
  }

  function insertMention(user: UserMention) {
    const cursor = textareaRef.current?.selectionStart ?? body.length;
    const textBefore = body.slice(0, cursor);
    const textAfter = body.slice(cursor);
    const replaced = textBefore.replace(/@[\w.]*$/, `@${user.mentionHandle} `);
    setBody(replaced + textAfter);
    setMentionQuery(null);
    textareaRef.current?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setBody('');
      setMentionQuery(null);
    } catch {
      setError('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const showDropdown = mentionQuery !== null && mentionResults.length > 0;

  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        ref={textareaRef}
        value={body}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={3}
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      />

      {showDropdown && (
        <ul className="absolute z-50 mt-1 w-64 rounded-lg border border-border bg-popover shadow-md">
          {mentionResults.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(u);
                }}
                className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="font-medium">{u.displayName}</span>
                <span className="text-xs text-muted-foreground">@{u.mentionHandle}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}

      <div className="mt-2 flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={!body.trim() || submitting}>
          {submitting ? 'Posting…' : 'Post'}
        </Button>
      </div>
    </form>
  );
}
