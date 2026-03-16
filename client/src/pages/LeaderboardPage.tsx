import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Crown, Medal, Flame, Users, TrendingUp, PenLine, Star } from 'lucide-react';
import { leaderboardApi } from '../services/leaderboardApi';
import { categoryApi } from '../services/categoryApi';
import { AppHeader } from '../components/layout/AppHeader';
import { CategoryNav } from '../components/layout/CategoryNav';
import { LeaderboardRow, ContributorRow } from '../components/leaderboard/LeaderboardRow';
import { RANK_TIERS } from '../utils/rankHelper';
import type { ContributorLeaderboardEntry, LeaderboardEntry, TimePeriod } from '../types/leaderboard';

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'Weekly', label: 'This Week' },
  { value: 'Monthly', label: 'This Month' },
  { value: 'AllTime', label: 'All Time' },
];

function LeaderboardTable({
  entries,
  emptyMessage,
  showActivity,
}: {
  entries: LeaderboardEntry[];
  emptyMessage: string;
  showActivity?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Users className="mx-auto mb-3 h-10 w-10 opacity-30" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border divide-y divide-border overflow-hidden">
      {entries.map((entry) => (
        <LeaderboardRow key={entry.userId} entry={entry} showActivity={showActivity} />
      ))}
    </div>
  );
}

function ContributorTable({ entries, emptyMessage }: { entries: ContributorLeaderboardEntry[]; emptyMessage: string }) {
  if (entries.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <PenLine className="mx-auto mb-3 h-10 w-10 opacity-30" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border divide-y divide-border overflow-hidden">
      {entries.map((entry) => (
        <ContributorRow key={entry.userId} entry={entry} />
      ))}
    </div>
  );
}

type BoardTab = 'overall' | 'category' | 'active' | 'contributors';

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<BoardTab>('overall');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('AllTime');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  const flatCategories = categories.flatMap((c) => [c, ...c.children]);

  const { data: overallBoard, isLoading: loadingOverall } = useQuery({
    queryKey: ['leaderboard', 'overall', timePeriod],
    queryFn: () => leaderboardApi.getOverall(timePeriod),
    enabled: activeTab === 'overall',
  });

  const { data: categoryBoard, isLoading: loadingCategory } = useQuery({
    queryKey: ['leaderboard', 'category', selectedCategoryId, timePeriod],
    queryFn: () => leaderboardApi.getByCategory(selectedCategoryId!, timePeriod),
    enabled: activeTab === 'category' && selectedCategoryId !== null,
  });

  const { data: activeBoard, isLoading: loadingActive } = useQuery({
    queryKey: ['leaderboard', 'active', timePeriod],
    queryFn: () => leaderboardApi.getMostActive(timePeriod),
    enabled: activeTab === 'active',
  });

  const { data: contributorBoard, isLoading: loadingContributors } = useQuery({
    queryKey: ['leaderboard', 'contributors'],
    queryFn: () => leaderboardApi.getContributors(),
    enabled: activeTab === 'contributors',
  });

  // Auto-select first category
  if (activeTab === 'category' && selectedCategoryId === null && flatCategories.length > 0) {
    setSelectedCategoryId(flatCategories[0].id);
  }

  const isLoading =
    (activeTab === 'overall'      && loadingOverall) ||
    (activeTab === 'category'     && loadingCategory) ||
    (activeTab === 'active'       && loadingActive) ||
    (activeTab === 'contributors' && loadingContributors);

  const tabs: { key: BoardTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overall',      label: 'Top Points',  icon: <Trophy  className="h-4 w-4" /> },
    { key: 'category',     label: 'By Category', icon: <TrendingUp className="h-4 w-4" /> },
    { key: 'active',       label: 'Most Active', icon: <Flame   className="h-4 w-4" /> },
    { key: 'contributors', label: 'Authors',     icon: <PenLine className="h-4 w-4" /> },
  ];

  const showTimePeriod = activeTab !== 'contributors';

  return (
    <>
      <AppHeader />
      <CategoryNav />

      {/* Hero */}
      <div className="relative overflow-hidden border-b" style={{ background: 'linear-gradient(160deg,#1c1009,#1a1200,#0d0a00)' }}>
        <div className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-4 py-1.5">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Leaderboard</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Top Readers</h1>
          <p className="mt-2 text-sm text-white/50">
            See who's leading the community. Earn credits to climb the ranks!
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* Time period filter */}
        {showTimePeriod && (
          <div className="mb-5 flex items-center justify-center gap-1.5">
            {TIME_PERIODS.map((tp) => (
              <button
                key={tp.value}
                onClick={() => setTimePeriod(tp.value)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  timePeriod === tp.value
                    ? 'text-white shadow-sm'
                    : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                style={timePeriod === tp.value ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' } : undefined}
              >
                {tp.label}
              </button>
            ))}
          </div>
        )}

        {/* Board tabs */}
        <div className="mb-6 flex gap-1.5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'text-white shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              style={activeTab === tab.key ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' } : undefined}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Category selector */}
        {activeTab === 'category' && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {flatCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all border ${
                  selectedCategoryId === cat.id
                    ? 'text-white border-transparent shadow-sm'
                    : 'border-border text-muted-foreground hover:border-violet-400 hover:text-foreground'
                }`}
                style={selectedCategoryId === cat.id ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' } : undefined}
              >
                {cat.title}
              </button>
            ))}
          </div>
        )}

        {/* Contributors tab banner */}
        {activeTab === 'contributors' && (
          <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-start gap-3">
              <Star className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500 fill-current" />
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  ✍️ Contributor Champion
                </p>
                <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                  Authors earn 1 contributed point every time a unique reader finishes one of their stories.
                  The #1 author is crowned <strong>Contributor Champion</strong> each day — an exclusive title
                  that cannot be purchased anywhere.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Board content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {activeTab === 'overall' && (
              <LeaderboardTable
                entries={overallBoard?.entries ?? []}
                emptyMessage="No one on the leaderboard yet. Start earning credits!"
                showActivity
              />
            )}

            {activeTab === 'category' && (
              <>
                {categoryBoard?.categoryTitle && (
                  <h2 className="mb-3 text-lg font-semibold">{categoryBoard.categoryTitle}</h2>
                )}
                <LeaderboardTable
                  entries={categoryBoard?.entries ?? []}
                  emptyMessage={
                    selectedCategoryId === null
                      ? 'Select a category to see its leaderboard.'
                      : 'No activity in this category yet.'
                  }
                />
              </>
            )}

            {activeTab === 'active' && (
              <LeaderboardTable
                entries={activeBoard?.entries ?? []}
                emptyMessage="No activity tracked yet."
                showActivity
              />
            )}

            {activeTab === 'contributors' && (
              <ContributorTable
                entries={contributorBoard?.entries ?? []}
                emptyMessage="No contributed points yet. Publish a story and watch readers finish it!"
              />
            )}
          </>
        )}

        {/* Legend */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Crown className="h-4 w-4 text-yellow-500" /> 1st Place</span>
          <span className="flex items-center gap-1"><Medal className="h-4 w-4 text-gray-400" /> 2nd Place</span>
          <span className="flex items-center gap-1"><Medal className="h-4 w-4 text-amber-700" /> 3rd Place</span>
          {activeTab === 'contributors' ? (
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-emerald-500 fill-current" /> Champion = exclusive daily title
            </span>
          ) : (
            <span className="flex items-center gap-1">
              Titles shown as
              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>badge</span>
            </span>
          )}
        </div>

        {/* Rank tier legend */}
        {activeTab !== 'contributors' && (
          <div className="mt-6 rounded-2xl border border-border p-4">
            <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rank Tiers</h3>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {RANK_TIERS.map((t) => (
                <div key={t.name} className="flex flex-col items-center gap-1">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-[10px] font-medium" style={{ color: t.color }}>{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
