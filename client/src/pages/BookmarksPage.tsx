import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bookmark, BookmarkX, Calendar, Clock, Eye, ThumbsUp, ArrowRight } from 'lucide-react';
import { bookmarkApi } from '../services/bookmarkApi';
import { AppHeader } from '../components/layout/AppHeader';
import { CategoryNav } from '../components/layout/CategoryNav';
import { BookmarkButton } from '../components/bookmarks/BookmarkButton';

import { readTime } from '../utils/storyUtils';

export function BookmarksPage() {
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => bookmarkApi.getAll(),
  });

  return (
    <>
      <AppHeader />
      <CategoryNav />

      {/* Hero */}
      <div className="relative overflow-hidden border-b" style={{ background: 'linear-gradient(160deg,#0f0b1e,#1a1535)' }}>
        <div className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Bookmark className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Saved Stories</h1>
              <p className="text-sm text-white/50">
                {stories.length > 0
                  ? `${stories.length} stor${stories.length === 1 ? 'y' : 'ies'} saved`
                  : 'Your saved stories will appear here'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          </div>
        ) : stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
            <BookmarkX className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="font-semibold">No saved stories yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the bookmark icon on any story to save it for later.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              Browse stories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {stories.map((story) => (
              <div key={story.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md">
                {story.coverImageUrl && (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={story.coverImageUrl}
                      alt={story.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/stories/${story.id}`} className="flex-1 min-w-0">
                      <h2 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-violet-600 transition-colors">
                        {story.title}
                      </h2>
                    </Link>
                    <BookmarkButton storyId={story.id} isBookmarked variant="icon" />
                  </div>

                  {story.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{story.excerpt}</p>
                  )}

                  {story.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {story.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-400"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto flex-wrap">
                    <span className="font-semibold text-violet-600 dark:text-violet-400 truncate">{story.categoryTitle}</span>
                    {story.publishDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(story.publishDate).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    )}
                    {story.latestDetail?.wordCount ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {readTime(story.latestDetail.wordCount)}
                      </span>
                    ) : null}
                    {story.viewCount > 0 && (
                      <span className="flex items-center gap-1 ml-auto">
                        <Eye className="h-3 w-3" /> {story.viewCount.toLocaleString()}
                      </span>
                    )}
                    {story.upvoteCount > 0 && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <ThumbsUp className="h-3 w-3" /> {story.upvoteCount}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/stories/${story.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                  >
                    Read story <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
