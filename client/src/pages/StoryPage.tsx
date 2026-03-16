import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, User, Tag as TagIcon, BookOpen, Eye, Coins, Play, Sparkles } from 'lucide-react';
import { storyApi } from '../services/storyApi';
import { voteApi } from '../services/voteApi';
import { creditApi } from '../services/creditApi';
import { readTime } from '../utils/storyUtils';
import { renderMarkdown } from '../utils/markdownUtils';
import { SITE_URL } from '../constants/siteConfig';
import { SEOHead, JsonLd } from '../components/SEOHead';
import { CategoryNav } from '../components/layout/CategoryNav';
import { Button } from '../components/ui/button';
import { ReactionBar } from '../components/reactions/ReactionBar';
import { CommentList } from '../components/comments/CommentList';
import { AppHeader } from '../components/layout/AppHeader';
import { VoteButtons } from '../components/votes/VoteButtons';
import { BookmarkButton } from '../components/bookmarks/BookmarkButton';
import { useAuthStore } from '../store/authStore';
import type { VoteResult } from '../types/vote';
import { InteractiveStoryViewer } from '../components/interactive/InteractiveStoryViewer';

export function StoryPage() {
  const { id } = useParams<{ id: string }>();
  const storyId = parseInt(id ?? '0', 10);

  const { data: story, isLoading, error } = useQuery({
    queryKey: ['story', storyId],
    queryFn: () => storyApi.getById(storyId),
    enabled: !!storyId,
  });

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [storyVote, setStoryVote] = useState<VoteResult | null>(null);
  const [creditClaimed, setCreditClaimed] = useState(false);
  const [showInteractive, setShowInteractive] = useState(false);

  // Auto-launch the interactive viewer once the story type is known
  useEffect(() => {
    if (story?.storyType === 'Interactive' && isAuthenticated && !showInteractive) {
      setShowInteractive(true);
    }
  }, [story?.storyType, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const { mutate: claimRead, isPending: claimingRead } = useMutation({
    mutationFn: () => creditApi.claimStoryRead(storyId),
    onSuccess: () => setCreditClaimed(true),
    onError: () => setCreditClaimed(true), // Already claimed — hide button
  });

  const voteData: VoteResult = storyVote ?? {
    upvoteCount: story?.upvoteCount ?? 0,
    downvoteCount: story?.downvoteCount ?? 0,
    currentUserVote: story?.currentUserVote ?? null,
  };

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

  if (error || !story) {
    return (
      <>
        {nav}
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Story not found or not yet published.</p>
          <Link to="/" className="mt-4 inline-block">
            <Button variant="outline" className="gap-2 mt-4">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </>
    );
  }

  const detail = story.latestDetail;

  const pageUrl = `${SITE_URL}/stories/${storyId}`;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: story.title,
    description: story.excerpt ?? story.description ?? '',
    image: story.coverImageUrl ?? undefined,
    author: story.authorName
      ? { '@type': 'Person', name: story.authorName }
      : { '@type': 'Organization', name: 'UpToU' },
    publisher: { '@type': 'Organization', name: 'UpToU', url: SITE_URL },
    datePublished: story.publishDate ?? undefined,
    url: pageUrl,
    keywords: story.tags.map((t) => t.name).join(', '),
  };

  return (
    <>
      <SEOHead
        title={story.title}
        description={story.excerpt ?? story.description ?? undefined}
        image={story.coverImageUrl}
        url={pageUrl}
        type="article"
        publishedTime={story.publishDate ?? undefined}
        author={story.authorName}
        keywords={story.tags.map((t) => t.name)}
      />
      <JsonLd data={articleSchema} />
      {nav}

      {/* Hero with background image */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden">
        {story.coverImageUrl ? (
          <img
            src={story.coverImageUrl}
            alt={story.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40" />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Hero content */}
        <div className="absolute inset-0 flex flex-col justify-end px-4 pb-8 sm:px-10">
          <div className="mx-auto w-full max-w-3xl">
            {/* Breadcrumb */}
            <div className="mb-3 flex items-center gap-2 text-xs text-white/70">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link to={`/categories/${story.categoryId}`} className="hover:text-white transition-colors">
                {story.categoryTitle}
              </Link>
              <span>/</span>
              <span className="text-white/90 truncate max-w-[200px]">{story.title}</span>
            </div>

            {/* Tags */}
            {story.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {story.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-xs font-medium text-white"
                  >
                    <TagIcon className="h-3 w-3" />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-2xl font-extrabold text-white sm:text-4xl leading-tight drop-shadow">
              {story.title}
            </h1>

            {story.excerpt && (
              <p className="mt-2 text-sm text-white/80 max-w-2xl line-clamp-2">{story.excerpt}</p>
            )}

            {/* Meta row */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/70">
              {story.authorName && (
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {story.authorName}
                </span>
              )}
              {story.publishDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(story.publishDate).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              )}
              {detail && detail.wordCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {readTime(detail.wordCount)}
                </span>
              )}
              {story.viewCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  {story.viewCount.toLocaleString()} views
                </span>
              )}
              {detail && (
                <span className="text-white/50">rev {detail.revision}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Article body */}
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          to={`/categories/${story.categoryId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {story.categoryTitle}
        </Link>

        {story.storyType === 'Interactive' ? (
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{ minHeight: '380px' }}
          >
            {/* Background */}
            {story.coverImageUrl ? (
              <img
                src={story.coverImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                aria-hidden
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' }}
              />
            )}

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/85" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

            {/* Floating ambient glow */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
              style={{
                width: '400px',
                height: '200px',
                background: 'radial-gradient(ellipse, rgba(99,102,241,0.25) 0%, transparent 70%)',
                filter: 'blur(32px)',
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-end px-8 py-12 text-center" style={{ minHeight: '380px' }}>
              {/* Badge */}
              <div
                className="mb-5 flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
                style={{
                  background: 'rgba(99,102,241,0.18)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Sparkles className="h-3 w-3 text-indigo-400" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-300">
                  Interactive Story
                </span>
              </div>

              <h3
                className="mb-3 text-2xl font-extrabold text-white sm:text-3xl"
                style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}
              >
                {story.title}
              </h3>

              <p className="mb-2 max-w-sm text-sm leading-relaxed text-white/60">
                Every choice matters. Shape your own path and earn credits along the way.
              </p>

              {/* Stats row */}
              {story.viewCount > 0 && (
                <div className="mb-7 flex items-center gap-4 text-xs text-white/35">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {story.viewCount.toLocaleString()} plays
                  </span>
                  {story.categoryTitle && (
                    <>
                      <span className="h-3 w-px bg-white/20" />
                      <span>{story.categoryTitle}</span>
                    </>
                  )}
                </div>
              )}

              {/* CTA */}
              {isAuthenticated ? (
                <button
                  onClick={() => setShowInteractive(true)}
                  className="group relative overflow-hidden rounded-2xl px-10 py-4 text-sm font-bold text-white transition-transform duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                    boxShadow: '0 0 28px rgba(99,102,241,0.5), 0 4px 24px rgba(0,0,0,0.4)',
                  }}
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative flex items-center gap-2.5">
                    <Play className="h-4 w-4 fill-white" />
                    Begin Adventure
                  </span>
                </button>
              ) : (
                <Link to={`/login?redirect=/stories/${storyId}`}>
                  <button
                    className="group relative overflow-hidden rounded-2xl px-10 py-4 text-sm font-bold text-white transition-transform duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                      boxShadow: '0 0 28px rgba(99,102,241,0.5), 0 4px 24px rgba(0,0,0,0.4)',
                    }}
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <span className="relative flex items-center gap-2.5">
                      <Play className="h-4 w-4 fill-white" />
                      Login to Play
                    </span>
                  </button>
                </Link>
              )}
            </div>
          </div>
        ) : detail?.content ? (
          <article
            className="prose prose-neutral max-w-none text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: `<p class="mb-4">${renderMarkdown(detail.content)}</p>`,
            }}
          />
        ) : (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p>Content coming soon.</p>
          </div>
        )}

        {/* Claim credits for reading */}
        {isAuthenticated && story.storyType !== 'Interactive' && detail?.content && !creditClaimed && (
          <div className="my-6 flex items-center justify-center rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => claimRead()}
              disabled={claimingRead}
              className="gap-1.5 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
            >
              <Coins className="h-4 w-4" />
              {claimingRead ? 'Claiming…' : 'Finished reading? Claim +5 credits'}
            </Button>
          </div>
        )}
        {creditClaimed && (
          <div className="my-6 flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <Coins className="h-4 w-4" />
            Credits claimed for this story!
          </div>
        )}

        <div className="flex items-center justify-between py-4 border-b border-border flex-wrap gap-3">
          <VoteButtons
            upvoteCount={voteData.upvoteCount}
            downvoteCount={voteData.downvoteCount}
            currentUserVote={voteData.currentUserVote}
            onVote={(type) => voteApi.voteStory(storyId, type)}
            onVoteSuccess={setStoryVote}
            size="md"
          />
          <div className="flex items-center gap-4">
            <BookmarkButton
              storyId={storyId}
              isBookmarked={story.isBookmarked}
            />
            <ReactionBar storyId={storyId} />
          </div>
        </div>
        <CommentList storyId={storyId} />
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

      {/* Full-page interactive viewer — slides in from the right */}
      {showInteractive && (
        <>
          <style>{`
            @keyframes story-slide-in {
              from { transform: translateX(100%) }
              to   { transform: translateX(0) }
            }
            .story-slide-in { animation: story-slide-in 0.4s cubic-bezier(.4,0,.2,1) both }
          `}</style>
          <div className="fixed inset-0 z-50 story-slide-in">
            <InteractiveStoryViewer
              storyId={story.id}
              storyTitle={story.title}
              onClose={() => setShowInteractive(false)}
            />
          </div>
        </>
      )}
    </>
  );
}
