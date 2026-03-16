import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, BookOpen, Calendar, Clock,
  Eye, Star, ThumbsUp, ChevronRight,
} from 'lucide-react';
import { categoryApi } from '../services/categoryApi';
import { storyApi } from '../services/storyApi';
import { CategoryNav } from '../components/layout/CategoryNav';
import { SEOHead, JsonLd } from '../components/SEOHead';
import { Button } from '../components/ui/button';
import { AppHeader } from '../components/layout/AppHeader';
import { BookmarkButton } from '../components/bookmarks/BookmarkButton';

import { readTime } from '../utils/storyUtils';
import { getCategoryGradient } from '../constants/categoryConfig';

const SORT_OPTIONS = [
  { value: 'Newest',        label: 'Newest' },
  { value: 'Oldest',        label: 'Oldest' },
  { value: 'MostUpvoted',   label: 'Most Upvoted' },
  { value: 'MostViewed',    label: 'Most Viewed' },
];


export function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const categoryId = parseInt(id ?? '0', 10);
  const [sortBy, setSortBy] = useState('Newest');

  const { data: category, isLoading, error } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => categoryApi.getById(categoryId),
    enabled: !!categoryId,
  });

  const { data: stories = [], isLoading: storiesLoading } = useQuery({
    queryKey: ['stories', categoryId, sortBy],
    queryFn: () => storyApi.getByCategory(categoryId, sortBy),
    enabled: !!categoryId,
  });

  const nav = <><AppHeader /><CategoryNav /></>;

  if (isLoading) {
    return (
      <>{nav}<div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div></>
    );
  }

  if (error || !category) {
    return (
      <>{nav}<div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <p className="text-muted-foreground">Category not found.</p>
        <Link to="/" className="mt-4 inline-block">
          <Button variant="outline" className="mt-4 gap-2"><ArrowLeft className="h-4 w-4" /> Back to Home</Button>
        </Link>
      </div></>
    );
  }

  const [gradFrom, gradTo] = getCategoryGradient(category.title);
  const featuredStories = stories.filter((s) => s.isFeatured);
  const regularStories  = stories.filter((s) => !s.isFeatured);

  const SITE_URL  = (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://uptou.com';
  const pageUrl   = `${SITE_URL}/categories/${categoryId}`;

  return (
    <>
      <SEOHead
        title={`${category.title} Stories`}
        description={category.description ?? `Browse stories in ${category.title} on UpToU.`}
        url={pageUrl}
        keywords={[category.title, ...(category.children ?? []).map((c) => c.title), 'stories', 'UpToU']}
      />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: category.title, item: pageUrl },
      ]}} />
      {nav}

      {/* ── Category hero ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b" style={{ background: `linear-gradient(160deg,${gradFrom},${gradTo})` }}>
        <div className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <nav className="mb-5 flex items-center gap-2 text-xs text-white/50">
            <Link to="/" className="hover:text-white/80 transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-white/90">{category.title}</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{category.title}</h1>
          {category.description && (
            <p className="mt-3 max-w-xl text-base text-white/60">{category.description}</p>
          )}
          {stories.length > 0 && (
            <p className="mt-4 text-sm font-semibold text-white/50">{stories.length} published {stories.length === 1 ? 'story' : 'stories'}</p>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Sub-categories */}
        {category.children.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-lg font-bold">Explore within {category.title}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {category.children.map((child) => (
                <Link key={child.id} to={`/categories/${child.id}`}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
                  <div className="min-w-0">
                    <h3 className="font-semibold group-hover:text-violet-600 transition-colors">{child.title}</h3>
                    {child.description && <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{child.description}</p>}
                  </div>
                  <ArrowRight className="ml-3 h-4 w-4 flex-shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-500" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Stories header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <BookOpen className="h-5 w-5 text-violet-600" />
            Stories
            {stories.length > 0 && <span className="text-sm font-normal text-muted-foreground">({stories.length})</span>}
          </h2>
          <select
            value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {storiesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-16 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="font-semibold">No published stories yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Stories for <strong>{category.title}</strong> will appear here once published.</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featuredStories.length > 0 && (
              <div className="mb-6 grid gap-5 sm:grid-cols-2">
                {featuredStories.map((story) => (
                  <Link key={story.id} to={`/stories/${story.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-xl">
                    <div className="relative h-52 overflow-hidden">
                      {story.coverImageUrl
                        ? <img src={story.coverImageUrl} alt={story.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        : <div className="h-full bg-gradient-to-br from-violet-500/30 to-indigo-500/10" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                        <Star className="h-3 w-3 fill-current" /> Featured
                      </span>
                      {story.tags.length > 0 && (
                        <div className="absolute bottom-3 left-3 flex gap-1.5">
                          {story.tags.slice(0, 3).map((tag) => (
                            <span key={tag.id} className="rounded-full bg-white/15 px-2 py-0.5 text-xs text-white backdrop-blur-sm">{tag.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold leading-snug line-clamp-2 group-hover:text-violet-600 transition-colors">{story.title}</h3>
                      {story.excerpt && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{story.excerpt}</p>}
                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        {story.publishDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(story.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                        {story.latestDetail?.wordCount ? <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{readTime(story.latestDetail.wordCount)}</span> : null}
                        {story.viewCount > 0 && <span className="ml-auto flex items-center gap-1"><Eye className="h-3 w-3" />{story.viewCount.toLocaleString()}</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Regular grid */}
            {regularStories.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regularStories.map((story) => (
                  <Link key={story.id} to={`/stories/${story.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md">
                    {story.coverImageUrl && (
                      <div className="relative h-36 overflow-hidden">
                        <img src={story.coverImageUrl} alt={story.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      {story.tags.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {story.tags.slice(0, 3).map((tag) => (
                            <span key={tag.id} className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-400">{tag.name}</span>
                          ))}
                        </div>
                      )}
                      <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-violet-600 transition-colors">{story.title}</h3>
                      {story.excerpt && <p className="mt-1.5 flex-1 text-sm text-muted-foreground line-clamp-2">{story.excerpt}</p>}
                      <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                        {story.publishDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(story.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                        {story.viewCount > 0 && <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{story.viewCount.toLocaleString()}</span>}
                        {story.upvoteCount > 0 && <span className="flex items-center gap-1 text-emerald-600"><ThumbsUp className="h-3 w-3" />{story.upvoteCount}</span>}
                        {story.latestDetail?.wordCount ? <span className="flex items-center gap-1 ml-auto"><Clock className="h-3 w-3" />{readTime(story.latestDetail.wordCount)}</span> : null}
                        <BookmarkButton storyId={story.id} isBookmarked={story.isBookmarked} variant="icon" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mt-20 border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <span className="font-extrabold text-foreground">UpToU</span>
          <span>© {new Date().getFullYear()} UpToU, Inc.</span>
          <div className="flex gap-5"><a href="#" className="hover:text-foreground">Privacy</a><a href="#" className="hover:text-foreground">Terms</a></div>
        </div>
      </footer>
    </>
  );
}
