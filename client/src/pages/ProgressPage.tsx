import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { BookOpen, Flame, Sparkles, TrendingUp } from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { progressApi } from '../services/progressApi';
import { timeAgo } from '../utils/dateUtils';
import type { InProgressStory, SuggestedStory, CategoryCredit, DailyCredit } from '../types/progress';

// ── Helpers ───────────────────────────────────────────────────────────────────

const BAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
    </div>
  );
}

function isInProgressStory(story: SuggestedStory | InProgressStory): story is InProgressStory {
  return 'visitedNodes' in story;
}

function StoryCard({ story, showProgress }: { story: SuggestedStory | InProgressStory; showProgress?: boolean }) {
  const inProgress = isInProgressStory(story);
  const id = inProgress ? story.storyId : story.id;
  const pct = inProgress && story.totalNodes > 0
    ? Math.round((story.visitedNodes / story.totalNodes) * 100)
    : 0;

  return (
    <Link to={'/stories/' + id}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-violet-300/50 hover:shadow-md">
      {story.coverImageUrl ? (
        <div className="aspect-[16/9] overflow-hidden">
          <img src={story.coverImageUrl} alt={story.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-primary/40" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {story.categoryTitle}
        </span>
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{story.title}</p>
        {showProgress && isInProgressStory(story) && (
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{story.visitedNodes}/{story.totalNodes} nodes</span>
              <span className="font-semibold text-primary">{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: pct + '%' }} />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {story.pointsEarned} pts · updated {timeAgo(story.updatedAt)}
            </p>
          </div>
        )}
        {!isInProgressStory(story) && (
          <p className="mt-auto pt-1 text-[10px] text-muted-foreground">
            {story.viewCount.toLocaleString()} views
          </p>
        )}
      </div>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ProgressPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['user-progress'],
    queryFn: () => progressApi.getProgress().then((r) => r.data),
    staleTime: 2 * 60_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <div className="relative overflow-hidden border-b" style={{ background: 'linear-gradient(160deg,#080c14,#0f172a)' }}>
        <div className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">My Progress</h1>
          <p className="mt-2 text-sm text-white/50">
            Your learning journey, stats, and story recommendations.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

        {isLoading || !data ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {/* ── Quick stats ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Stories Started',   value: data.totalStarted,    icon: '📖' },
                { label: 'Stories Completed', value: data.totalCompleted,  icon: '✅' },
                { label: 'In Progress',       value: data.inProgressStories.length, icon: '⏳' },
                { label: 'Categories',        value: data.categoryCredits.length,   icon: '🗂️' },
              ].map(({ label, value, icon }) => (
                <div key={label}
                  className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card p-4 text-center">
                  <span className="text-2xl">{icon}</span>
                  <p className="text-2xl font-extrabold">{value}</p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* ── Charts row ──────────────────────────────────────── */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Credits by Category */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <SectionTitle icon={<TrendingUp className="h-4 w-4" />} title="Credits by Category" />
                {data.categoryCredits.length === 0 ? (
                  <EmptyState message="No category credits yet. Start reading stories!" />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.categoryCredits as CategoryCredit[]} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                      <YAxis type="category" dataKey="categoryTitle" width={90}
                        tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                      <RTooltip
                        contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                        formatter={(v) => [String(v) + ' pts', 'Credits']}
                      />
                      <Bar dataKey="creditsEarned" radius={[0, 4, 4, 0]}>
                        {data.categoryCredits.map((_: CategoryCredit, i: number) => (
                          <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Daily Credits (last 30 days) */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <SectionTitle icon={<Sparkles className="h-4 w-4" />} title="Points Earned (Last 30 Days)" />
                {data.dailyCredits.length === 0 ? (
                  <EmptyState message="No activity yet this month." />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data.dailyCredits as DailyCredit[]} margin={{ left: -16, right: 8, top: 4, bottom: 4 }}>
                      <defs>
                        <linearGradient id="credGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tickFormatter={fmtDate}
                        tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                      <RTooltip
                        contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                        labelFormatter={(v) => fmtDate(v as string)}
                        formatter={(v) => [String(v) + ' pts', 'Credits']}
                      />
                      <Area type="monotone" dataKey="creditsEarned" stroke="#6366f1" strokeWidth={2}
                        fill="url(#credGrad)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── In-progress stories ─────────────────────────────── */}
            <div>
              <SectionTitle icon={<BookOpen className="h-4 w-4" />} title="Continue Reading" />
              {data.inProgressStories.length === 0 ? (
                <EmptyState message="No stories in progress. Pick one below to start!" />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.inProgressStories.map((s: InProgressStory) => (
                    <StoryCard key={s.storyId} story={s} showProgress />
                  ))}
                </div>
              )}
            </div>

            {/* ── Suggested stories ───────────────────────────────── */}
            <div>
              <SectionTitle icon={<Sparkles className="h-4 w-4" />} title="Suggested for You" />
              {data.suggestedStories.length === 0 ? (
                <EmptyState message="You've started all available stories — great work!" />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.suggestedStories.map((s: SuggestedStory) => (
                    <StoryCard key={s.id} story={s} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Trending stories ────────────────────────────────── */}
            <div>
              <SectionTitle icon={<Flame className="h-4 w-4" />} title="Trending This Week" />
              {data.trendingStories.length === 0 ? (
                <EmptyState message="No trending stories yet." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.trendingStories.map((s: SuggestedStory) => (
                    <StoryCard key={s.id} story={s} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
