import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { bookmarkApi } from '../../services/bookmarkApi';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';

interface BookmarkButtonProps {
  storyId: number;
  isBookmarked: boolean;
  /** 'icon' = icon-only button, 'label' = icon + text (default) */
  variant?: 'icon' | 'label';
}

export function BookmarkButton({ storyId, isBookmarked: initial, variant = 'label' }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initial);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  const { mutate: toggle, isPending } = useMutation({
    mutationFn: () => bookmarkApi.toggle(storyId),
    onSuccess: (nowBookmarked) => {
      setBookmarked(nowBookmarked);
      // Invalidate bookmarks list so /bookmarks page stays fresh
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        title="Sign in to save this story"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bookmark className="h-4 w-4" />
        {variant === 'label' && <span>Save</span>}
      </Link>
    );
  }

  return (
    <button
      onClick={() => !isPending && toggle()}
      title={bookmarked ? 'Remove bookmark' : 'Save for later'}
      className={[
        'flex items-center gap-1.5 text-sm font-medium transition-colors',
        isPending ? 'opacity-60 cursor-wait' : 'cursor-pointer',
        bookmarked
          ? 'text-primary hover:text-primary/70'
          : 'text-muted-foreground hover:text-foreground',
      ].join(' ')}
    >
      {bookmarked
        ? <BookmarkCheck className="h-4 w-4 fill-primary" />
        : <Bookmark className="h-4 w-4" />
      }
      {variant === 'label' && <span>{bookmarked ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
