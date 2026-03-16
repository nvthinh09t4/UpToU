import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Play, Star } from 'lucide-react';
import { ratingApi } from '../../services/ratingApi';
import { useAuthStore } from '../../store/authStore';

function StarDisplay({ rating, count }: { rating: number; count: number }) {
  if (count === 0) return null;
  return (
    <span className="flex items-center gap-1 text-[10px] text-amber-400/80">
      <Star className="h-3 w-3 fill-amber-400/70 text-amber-400/70" />
      {rating.toFixed(1)}
      <span className="text-white/30">({count})</span>
    </span>
  );
}

export function RecommendationPanel() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['recommended-stories'],
    queryFn: () => ratingApi.getRecommended(6),
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });

  if (!isAuthenticated || (stories.length === 0 && !isLoading)) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-5 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <h2 className="text-base font-bold text-foreground">Recommended for You</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map(story => (
            <Link
              key={story.id}
              to={story.slug ? `/stories/${story.slug}` : `/stories/id/${story.id}`}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg"
            >
              {story.coverImageUrl && (
                <div
                  className="h-28 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${story.coverImageUrl})` }}
                >
                  <div className="h-full w-full bg-gradient-to-b from-transparent to-black/60" />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-1 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                    {story.title}
                  </p>
                  {story.storyType === 'Interactive' && (
                    <Play className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  )}
                </div>
                {story.excerpt && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{story.excerpt}</p>
                )}
                <div className="mt-auto flex items-center justify-between pt-1">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {story.reasonCategory}
                  </span>
                  <StarDisplay rating={story.averageRating} count={story.ratingCount} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
