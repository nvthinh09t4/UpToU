import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, User, Tag as TagIcon, BookOpen, Eye } from 'lucide-react';
import { storyApi } from '../services/storyApi';
import { voteApi } from '../services/voteApi';
import { CategoryNav } from '../components/layout/CategoryNav';
import { Button } from '../components/ui/button';
import { ReactionBar } from '../components/reactions/ReactionBar';
import { CommentList } from '../components/comments/CommentList';
import { AppHeader } from '../components/layout/AppHeader';
import { VoteButtons } from '../components/votes/VoteButtons';
import type { VoteResult } from '../types/vote';

function readTime(wordCount: number): string {
  const minutes = Math.max(1, Math.round(wordCount / 200));
  return `${minutes} min read`;
}

function renderMarkdown(content: string): string {
  return content
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre class="bg-muted rounded-lg p-4 overflow-x-auto my-4 text-sm font-mono"><code>$1</code></pre>')
    .replace(/^\| (.+) \|$/gm, (_, row) => {
      const cells = row.split(' | ').map((c: string) => `<td class="border border-border px-3 py-2 text-sm">${c}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, (table) => `<div class="overflow-x-auto my-4"><table class="border-collapse border border-border w-full">${table}</table></div>`)
    .replace(/^---$/gm, '<hr class="my-6 border-border">')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 my-4 text-muted-foreground italic">$1</blockquote>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="flex items-center gap-2 my-1"><span class="h-4 w-4 rounded border border-border inline-block"></span>$1</li>')
    .replace(/^- (.+)$/gm, '<li class="list-disc ml-6 my-1">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="list-decimal ml-6 my-1">$2</li>')
    .replace(/(<li.*<\/li>\n?)+/g, (list) => `<ul class="my-3">${list}</ul>`)
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^(?!<[hbpuolt])/gm, '')
    .trim();
}

export function StoryPage() {
  const { id } = useParams<{ id: string }>();
  const storyId = parseInt(id ?? '0', 10);

  const { data: story, isLoading, error } = useQuery({
    queryKey: ['story', storyId],
    queryFn: () => storyApi.getById(storyId),
    enabled: !!storyId,
  });

  const [storyVote, setStoryVote] = useState<VoteResult | null>(null);

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

  return (
    <>
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

        {detail?.content ? (
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

        <div className="flex items-center justify-between py-4 border-b border-border">
          <VoteButtons
            upvoteCount={voteData.upvoteCount}
            downvoteCount={voteData.downvoteCount}
            currentUserVote={voteData.currentUserVote}
            onVote={(type) => voteApi.voteStory(storyId, type)}
            onVoteSuccess={setStoryVote}
            size="md"
          />
          <ReactionBar storyId={storyId} />
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
    </>
  );
}
