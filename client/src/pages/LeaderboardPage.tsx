import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Crown, Medal, Flame, Coins, Users, TrendingUp } from 'lucide-react';
import { leaderboardApi } from '../services/leaderboardApi';
import { categoryApi } from '../services/categoryApi';
import { AppHeader } from '../components/layout/AppHeader';
import { CategoryNav } from '../components/layout/CategoryNav';
import { Button } from '../components/ui/button';
import { RANK_TIERS } from '../utils/rankHelper';
import type { LeaderboardEntry, TimePeriod } from '../types/leaderboard';

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'Weekly', label: 'This Week' },
  { value: 'Monthly', label: 'This Month' },
  { value: 'AllTime', label: 'All Time' },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return <Crown className="h-5 w-5 text-yellow-500" />;
  if (rank === 2)
    return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3)
    return <Medal className="h-5 w-5 text-amber-700" />;
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-muted-foreground">
      {rank}
    </span>
  );
}

function DotaRankBadge({ rankName, rankStars }: { rankName: string; rankStars: number }) {
  const rankTier = RANK_TIERS.find((t) => t.name === rankName) ?? RANK_TIERS[0];
  return (
    <div className="flex flex-col items-center" style={{ color: rankTier.color }}>
      <span className="text-xs font-bold leading-tight">{rankName}</span>
      <div className="flex gap-0.5 mt-0.5">
        {Array.from({ length: rankStars }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: rankTier.color }}
          />
        ))}
      </div>
    </div>
  );
}

function UserAvatar({ entry }: { entry: LeaderboardEntry }) {
  const initial = entry.displayName.charAt(0).toUpperCase();

  return (
    <div className="relative flex-shrink-0">
      {entry.activeAvatarFrameUrl ? (
        <div className="relative h-10 w-10">
          <img
            src={entry.activeAvatarFrameUrl}
            alt=""
            className="absolute inset-0 h-full w-full"
          />
          {entry.avatarUrl ? (
            <img
              src={entry.avatarUrl}
              alt={entry.displayName}
              className="absolute inset-1 h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="absolute inset-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {initial}
            </div>
          )}
        </div>
      ) : entry.avatarUrl ? (
        <img
          src={entry.avatarUrl}
          alt={entry.displayName}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {initial}
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({ entry, showActivity }: { entry: LeaderboardEntry; showActivity?: boolean }) {
  const isTop3 = entry.rank <= 3;
  const rankColor = RANK_TIERS.find((t) => t.name === entry.rankName)?.color ?? '#9e9e9e';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
        isTop3 ? 'bg-amber-500/5' : ''
      }`}
      style={{ borderLeft: `3px solid ${rankColor}` }}
    >
      <div className="flex w-8 items-center justify-center">
        <RankBadge rank={entry.rank} />
      </div>

      <UserAvatar entry={entry} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">{entry.displayName}</span>
          {entry.activeTitle && (
            <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {entry.activeTitle}
            </span>
          )}
        </div>
        {entry.mentionHandle && (
          <span className="text-xs text-muted-foreground">@{entry.mentionHandle}</span>
        )}
      </div>

      <div className="flex items-center gap-4 text-right">
        {/* Dota rank badge */}
        <div className="hidden sm:block">
          <DotaRankBadge rankName={entry.rankName} rankStars={entry.rankStars} />
        </div>

        {showActivity && (
          <div className="hidden sm:block">
            <p className="text-xs text-muted-foreground">Activities</p>
            <p className="text-sm font-semibold">{entry.activityCount.toLocaleString()}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Credits</p>
          <p className="flex items-center gap-1 text-sm font-bold text-amber-600 dark:text-amber-400">
            <Coins className="h-3.5 w-3.5" />
            {entry.totalCredits.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

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
    <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
      {entries.map((entry) => (
        <LeaderboardRow key={entry.userId} entry={entry} showActivity={showActivity} />
      ))}
    </div>
  );
}

type BoardTab = 'overall' | 'category' | 'active';

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<BoardTab>('overall');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('AllTime');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  // Flatten category tree for the selector
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

  // Auto-select first category
  if (activeTab === 'category' && selectedCategoryId === null && flatCategories.length > 0) {
    setSelectedCategoryId(flatCategories[0].id);
  }

  const isLoading =
    (activeTab === 'overall' && loadingOverall) ||
    (activeTab === 'category' && loadingCategory) ||
    (activeTab === 'active' && loadingActive);

  const tabs: { key: BoardTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overall', label: 'Top Points', icon: <Trophy className="h-4 w-4" /> },
    { key: 'category', label: 'By Category', icon: <TrendingUp className="h-4 w-4" /> },
    { key: 'active', label: 'Most Active', icon: <Flame className="h-4 w-4" /> },
  ];

  return (
    <>
      <AppHeader />
      <CategoryNav />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Leaderboard</span>
          </div>
          <h1 className="text-2xl font-bold">Top Contributors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            See who's leading the community. Earn credits to climb the ranks!
          </p>
        </div>

        {/* Time period filter */}
        <div className="mb-6 flex items-center justify-center gap-1">
          {TIME_PERIODS.map((tp) => (
            <Button
              key={tp.value}
              size="sm"
              variant={timePeriod === tp.value ? 'default' : 'ghost'}
              onClick={() => setTimePeriod(tp.value)}
            >
              {tp.label}
            </Button>
          ))}
        </div>

        {/* Board tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-background shadow-sm' : 'hover:bg-background/50'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Category selector for category tab */}
        {activeTab === 'category' && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {flatCategories.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategoryId(cat.id)}
                className="text-xs"
              >
                {cat.title}
              </Button>
            ))}
          </div>
        )}

        {/* Board content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
                  <h2 className="mb-3 text-lg font-semibold">
                    {categoryBoard.categoryTitle}
                  </h2>
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
          </>
        )}

        {/* Medal legend */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Crown className="h-4 w-4 text-yellow-500" /> 1st Place
          </span>
          <span className="flex items-center gap-1">
            <Medal className="h-4 w-4 text-gray-400" /> 2nd Place
          </span>
          <span className="flex items-center gap-1">
            <Medal className="h-4 w-4 text-amber-700" /> 3rd Place
          </span>
          <span className="flex items-center gap-1">
            Titles shown as
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">badge</span>
          </span>
        </div>

        {/* Rank tier legend */}
        <div className="mt-8 rounded-lg border border-border p-4">
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
      </main>
    </>
  );
}
