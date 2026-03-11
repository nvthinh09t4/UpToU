import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Tag as TagIcon, BarChart3, BookOpen, Calendar, Clock, Star, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
import { categoryApi } from '../services/categoryApi';
import { storyApi } from '../services/storyApi';
import { CategoryNav } from '../components/layout/CategoryNav';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AppHeader } from '../components/layout/AppHeader';
import { BookmarkButton } from '../components/bookmarks/BookmarkButton';

function readTime(wordCount: number): string {
  const minutes = Math.max(1, Math.round(wordCount / 200));
  return `${minutes} min`;
}

const SORT_OPTIONS = [
  { value: 'Newest', label: 'Newest' },
  { value: 'Oldest', label: 'Oldest' },
  { value: 'MostUpvoted', label: 'Most Upvoted' },
  { value: 'MostDownvoted', label: 'Most Downvoted' },
  { value: 'MostViewed', label: 'Most Viewed' },
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

  const nav = (
    <>
      <AppHeader />
      <CategoryNav />
    </>
  );

  if (isLoading) {
    return (
      <>
        {nav}
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </>
    );
  }

  if (error || !category) {
    return (
      <>
        {nav}
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <p className="text-muted-foreground">Category not found.</p>
          <Link to="/" className="mt-4 inline-block">
            <Button variant="outline" className="gap-2 mt-4">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </>
    );
  }

  const featuredStories = stories.filter((s) => s.isFeatured);
  const regularStories = stories.filter((s) => !s.isFeatured);

  return (
    <>
      {nav}

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{category.title}</span>
        </div>

        {/* Hero */}
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TagIcon className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{category.title}</h1>
          </div>
          {category.description && (
            <p className="max-w-2xl text-muted-foreground text-lg">{category.description}</p>
          )}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Score weight: <strong className="text-foreground">{category.scoreWeight.toFixed(1)}</strong>
            </span>
          </div>
        </div>

        {/* Sub-categories */}
        {category.children.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-bold">Sub-categories</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.children.map((child) => (
                <Link key={child.id} to={`/categories/${child.id}`}>
                  <Card className="border hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-5">
                      <h3 className="font-semibold mb-1">{child.title}</h3>
                      {child.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{child.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Stories */}
        <section>
          <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Stories in {category.title}
              {stories.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">({stories.length})</span>
              )}
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

          {storiesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border animate-pulse">
                  <CardContent className="p-0">
                    <div className="h-40 bg-muted rounded-t-lg" />
                    <div className="p-5">
                      <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted/70" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stories.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="font-medium">No published stories yet</p>
              <p className="mt-1 text-sm">
                Stories for <strong>{category.title}</strong> will appear here once published.
              </p>
            </div>
          ) : (
            <>
              {/* Featured stories — large cards with cover image */}
              {featuredStories.length > 0 && (
                <div className="mb-6 grid gap-6 sm:grid-cols-2">
                  {featuredStories.map((story) => (
                    <Link key={story.id} to={`/stories/${story.id}`}>
                      <Card className="border hover:shadow-lg transition-shadow overflow-hidden h-full group">
                        <div className="relative h-48 overflow-hidden">
                          {story.coverImageUrl ? (
                            <img
                              src={story.coverImageUrl}
                              alt={story.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full bg-gradient-to-br from-primary/30 to-primary/10" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-amber-400/90 px-2 py-0.5 text-xs font-semibold text-amber-900">
                            <Star className="h-3 w-3" /> Featured
                          </div>
                          {story.tags.length > 0 && (
                            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                              {story.tags.slice(0, 3).map((tag) => (
                                <span key={tag.id} className="rounded-full bg-white/20 backdrop-blur-sm px-2 py-0.5 text-xs text-white">
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <CardContent className="p-5">
                          <h3 className="font-bold text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {story.title}
                          </h3>
                          {story.excerpt && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{story.excerpt}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {story.publishDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(story.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                            {story.latestDetail && story.latestDetail.wordCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {readTime(story.latestDetail.wordCount)}
                              </span>
                            )}
                            {story.viewCount > 0 && (
                              <span className="flex items-center gap-1 ml-auto">
                                <Eye className="h-3 w-3" /> {story.viewCount.toLocaleString()}
                              </span>
                            )}
                            {story.upvoteCount > 0 && (
                              <span className="flex items-center gap-1 text-green-600">
                                <ThumbsUp className="h-3 w-3" /> {story.upvoteCount}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {/* Regular stories grid */}
              {regularStories.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {regularStories.map((story) => (
                    <Link key={story.id} to={`/stories/${story.id}`}>
                      <Card className="border hover:shadow-md transition-shadow flex flex-col h-full group">
                        {story.coverImageUrl && (
                          <div className="relative h-36 overflow-hidden rounded-t-lg">
                            <img
                              src={story.coverImageUrl}
                              alt={story.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          </div>
                        )}
                        <CardContent className="p-5 flex flex-col flex-1">
                          {story.tags.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-1.5">
                              {story.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}

                          <h3 className="font-semibold text-base leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {story.title}
                          </h3>

                          {story.excerpt && (
                            <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-3">
                              {story.excerpt}
                            </p>
                          )}

                          <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {story.publishDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(story.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            {story.viewCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" /> {story.viewCount.toLocaleString()}
                              </span>
                            )}
                            {story.upvoteCount > 0 && (
                              <span className="flex items-center gap-1 text-green-600">
                                <ThumbsUp className="h-3 w-3" /> {story.upvoteCount}
                              </span>
                            )}
                            {story.downvoteCount > 0 && (
                              <span className="flex items-center gap-1 text-red-500">
                                <ThumbsDown className="h-3 w-3" /> {story.downvoteCount}
                              </span>
                            )}
                            {story.latestDetail && story.latestDetail.wordCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {readTime(story.latestDetail.wordCount)}
                              </span>
                            )}
                            <span className="ml-auto">
                              <BookmarkButton storyId={story.id} isBookmarked={story.isBookmarked} variant="icon" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="border-t bg-muted/20 mt-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <span className="font-semibold text-foreground">UpToU</span>
          <span>© {new Date().getFullYear()} UpToU, Inc.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </>
  );
}
