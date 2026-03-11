import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Coins, Gift, Lock, CheckCircle, Sparkles, Star, History, Package } from 'lucide-react';
import { creditApi } from '../services/creditApi';
import { useAuthStore } from '../store/authStore';
import { AppHeader } from '../components/layout/AppHeader';
import { CategoryNav } from '../components/layout/CategoryNav';
import { Button } from '../components/ui/button';
import { getRank, RANK_TIERS } from '../utils/rankHelper';
import type { RewardItem } from '../types/credit';

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  Title: { label: 'Titles', icon: <Star className="h-4 w-4" /> },
  AvatarFrame: { label: 'Avatar Frames', icon: <Sparkles className="h-4 w-4" /> },
  Avatar: { label: 'Avatars', icon: <Gift className="h-4 w-4" /> },
  StoryAccess: { label: 'Story Access', icon: <Lock className="h-4 w-4" /> },
};

const TX_TYPE_LABELS: Record<string, string> = {
  DailyLogin: 'Daily Login',
  StoryRead: 'Story Read',
  CommentPost: 'Comment Posted',
  ReceiveUpvote: 'Upvote Received',
  RewardUnlock: 'Reward Unlocked',
};

function RewardCard({
  item,
  balance,
  onUnlock,
  onToggle,
}: {
  item: RewardItem;
  balance: number;
  onUnlock: (id: number) => void;
  onToggle: (id: number, activate: boolean) => void;
}) {
  const canAfford = balance >= item.creditCost;

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md">
      {/* Preview */}
      {item.previewUrl ? (
        <img
          src={item.previewUrl}
          alt={item.name}
          className="mb-3 h-20 w-20 self-center rounded-full object-cover"
        />
      ) : item.category === 'Title' ? (
        <div className="mb-3 flex h-20 w-full items-center justify-center rounded-lg bg-primary/5">
          <span className="text-lg font-bold text-primary">{item.value ?? item.name}</span>
        </div>
      ) : (
        <div className="mb-3 flex h-20 w-20 items-center justify-center self-center rounded-full bg-muted">
          <Gift className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      <h3 className="text-sm font-semibold">{item.name}</h3>
      {item.description && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
      )}

      <div className="mt-auto pt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          <Coins className="h-3.5 w-3.5" />
          {item.creditCost.toLocaleString()}
        </span>

        {item.isUnlocked ? (
          <Button
            size="sm"
            variant={item.isActive ? 'default' : 'outline'}
            onClick={() => onToggle(item.id, !item.isActive)}
          >
            {item.isActive ? (
              <>
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Equipped
              </>
            ) : (
              'Equip'
            )}
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={!canAfford}
            onClick={() => onUnlock(item.id)}
          >
            <Lock className="mr-1 h-3.5 w-3.5" />
            Unlock
          </Button>
        )}
      </div>
    </div>
  );
}

function MyItemCard({
  item,
  onToggle,
}: {
  item: RewardItem;
  onToggle: (id: number, activate: boolean) => void;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md">
      {/* Preview */}
      {item.previewUrl ? (
        <img
          src={item.previewUrl}
          alt={item.name}
          className="mb-3 h-20 w-20 self-center rounded-full object-cover"
        />
      ) : item.category === 'Title' ? (
        <div className="mb-3 flex h-20 w-full items-center justify-center rounded-lg bg-primary/5">
          <span className="text-lg font-bold text-primary">{item.value ?? item.name}</span>
        </div>
      ) : (
        <div className="mb-3 flex h-20 w-20 items-center justify-center self-center rounded-full bg-muted">
          <Gift className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      <h3 className="text-sm font-semibold">{item.name}</h3>
      {item.description && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
      )}

      <div className="mb-2">
        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {CATEGORY_LABELS[item.category]?.label ?? item.category}
        </span>
      </div>

      <div className="mt-auto pt-1">
        <Button
          size="sm"
          variant={item.isActive ? 'default' : 'outline'}
          className="w-full"
          onClick={() => onToggle(item.id, !item.isActive)}
        >
          {item.isActive ? (
            <>
              <CheckCircle className="mr-1 h-3.5 w-3.5" />
              Equipped
            </>
          ) : (
            'Equip'
          )}
        </Button>
      </div>
    </div>
  );
}

function RankSection({ totalCreditsEarned }: { totalCreditsEarned: number }) {
  const rank = getRank(totalCreditsEarned);
  const starBase = (() => {
    const tier = RANK_TIERS.find((t) => t.name === rank.name) ?? RANK_TIERS[0];
    return tier.min + (rank.stars - 1) * tier.perStar;
  })();

  return (
    <div className="mb-6 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-4">
        {/* Rank badge */}
        <div
          className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-full border-2 font-bold"
          style={{ borderColor: rank.color, color: rank.color }}
        >
          <span className="text-[11px] leading-tight">{rank.name}</span>
          <div className="mt-0.5 flex gap-0.5">
            {Array.from({ length: rank.stars }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: rank.color }}
              />
            ))}
          </div>
        </div>

        {/* Progress info */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold" style={{ color: rank.color }}>
              {rank.name} ★{rank.stars}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {rank.nextLabel === 'Max Rank'
                ? 'Max Rank'
                : `${totalCreditsEarned.toLocaleString()} / ${rank.nextAt.toLocaleString()} to ${rank.nextLabel}`}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${rank.progressPct}%`, backgroundColor: rank.color }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {totalCreditsEarned.toLocaleString()} total credits earned
            {rank.nextLabel !== 'Max Rank' && (
              <> &mdash; {(rank.nextAt - totalCreditsEarned).toLocaleString()} more to {rank.nextLabel}</>
            )}
          </p>
        </div>
      </div>

      {/* Star progress within tier (show how far into current star) */}
      <div className="mt-3 flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Star progress</span>
        <div className="flex-1 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full"
            style={{ width: `${rank.progressPct}%`, backgroundColor: rank.color, opacity: 0.7 }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">{rank.progressPct}%</span>
      </div>

      {/* Hint about star base */}
      <p className="mt-1 text-[10px] text-muted-foreground">
        Current star started at {starBase.toLocaleString()} credits
      </p>
    </div>
  );
}

export function RewardsPage() {
  const [activeTab, setActiveTab] = useState<'shop' | 'history' | 'myitems'>('shop');
  const [historyPage, setHistoryPage] = useState(1);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const { data: rewards = [], isLoading: loadingRewards } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => creditApi.getRewards(),
    enabled: !!user,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['credit-history', historyPage],
    queryFn: () => creditApi.getHistory(historyPage),
    enabled: !!user && activeTab === 'history',
  });

  const { data: balanceData } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: () => creditApi.getBalance(),
    enabled: !!user,
  });

  const { mutate: claimDaily, isPending: claimingDaily } = useMutation({
    mutationFn: () => creditApi.claimDailyLogin(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-history'] });
      queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
      refreshUser();
    },
  });

  const { mutate: unlock } = useMutation({
    mutationFn: (id: number) => creditApi.unlockReward(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
      refreshUser();
    },
  });

  const { mutate: toggle } = useMutation({
    mutationFn: ({ id, activate }: { id: number; activate: boolean }) =>
      creditApi.activateReward(id, activate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
      refreshUser();
    },
  });

  function refreshUser() {
    creditApi.getBalance().then((balance) => {
      if (user && accessToken) {
        setAuth(accessToken, {
          ...user,
          creditBalance: balance.balance,
          activeTitle: balance.activeTitle,
          activeAvatarFrameUrl: balance.activeAvatarFrameUrl,
          avatarUrl: balance.avatarUrl,
        });
      }
    });
  }

  // Group all rewards by category
  const grouped = rewards.reduce<Record<string, RewardItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  // Unlocked items grouped by category
  const unlockedItems = rewards.filter((item) => item.isUnlocked);
  const unlockedGrouped = unlockedItems.reduce<Record<string, RewardItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const totalCreditsEarned = balanceData?.totalCreditsEarned ?? 0;

  return (
    <>
      <AppHeader />
      <CategoryNav />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Rewards Shop</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Earn credits by reading stories, logging in daily, and more. Spend them on titles, avatar frames, and exclusive content.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2">
              <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {(user?.creditBalance ?? 0).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">credits</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => claimDaily()} disabled={claimingDaily}>
              <Gift className="mr-1 h-3.5 w-3.5" />
              {claimingDaily ? 'Claiming…' : 'Daily Bonus'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'shop' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
            }`}
          >
            <Gift className="mr-1.5 inline h-4 w-4" />
            Rewards Shop
          </button>
          <button
            onClick={() => setActiveTab('myitems')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'myitems' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
            }`}
          >
            <Package className="mr-1.5 inline h-4 w-4" />
            My Items
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'history' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
            }`}
          >
            <History className="mr-1.5 inline h-4 w-4" />
            Credit History
          </button>
        </div>

        {activeTab === 'shop' && (
          <>
            {/* Rank section */}
            {!!user && <RankSection totalCreditsEarned={totalCreditsEarned} />}

            {loadingRewards ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : rewards.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <Gift className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>No rewards available yet. Check back soon!</p>
              </div>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <section key={category} className="mb-8">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    {CATEGORY_LABELS[category]?.icon}
                    {CATEGORY_LABELS[category]?.label ?? category}
                  </h2>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((item) => (
                      <RewardCard
                        key={item.id}
                        item={item}
                        balance={user?.creditBalance ?? 0}
                        onUnlock={(id) => unlock(id)}
                        onToggle={(id, activate) => toggle({ id, activate })}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}

            {/* How to earn */}
            <section className="mt-10 rounded-lg border border-border bg-muted/30 p-6">
              <h2 className="mb-4 text-lg font-semibold">How to Earn Credits</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Daily Login', amount: 10, desc: 'Log in and claim once per day' },
                  { label: 'Read a Story', amount: 5, desc: 'Finish reading any story (once per story)' },
                  { label: 'Post a Comment', amount: 2, desc: 'Share your thoughts on a story' },
                  { label: 'Receive an Upvote', amount: 1, desc: 'Others appreciate your contribution' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 rounded-md bg-background p-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400">
                      +{item.amount}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'myitems' && (
          <>
            {loadingRewards ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : unlockedItems.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <Package className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>You haven't unlocked any items yet.</p>
                <p className="mt-1 text-sm">Visit the Rewards Shop to spend your credits!</p>
              </div>
            ) : (
              Object.entries(unlockedGrouped).map(([category, items]) => (
                <section key={category} className="mb-8">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    {CATEGORY_LABELS[category]?.icon}
                    {CATEGORY_LABELS[category]?.label ?? category}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      ({items.length})
                    </span>
                  </h2>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((item) => (
                      <MyItemCard
                        key={item.id}
                        item={item}
                        onToggle={(id, activate) => toggle({ id, activate })}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : !history || history.transactions.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <History className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>No credit transactions yet.</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-border">
                  {history.transactions.map((tx, i) => (
                    <div
                      key={tx.id}
                      className={`flex items-center justify-between px-4 py-3 ${
                        i > 0 ? 'border-t border-border' : ''
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {TX_TYPE_LABELS[tx.type] ?? tx.type}
                        </p>
                        {tx.description && (
                          <p className="text-xs text-muted-foreground">{tx.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          tx.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                        }`}
                      >
                        {tx.amount >= 0 ? '+' : ''}
                        {tx.amount}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {history.totalCount > 20 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={historyPage <= 1}
                      onClick={() => setHistoryPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {historyPage} of {Math.ceil(history.totalCount / 20)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={historyPage >= Math.ceil(history.totalCount / 20)}
                      onClick={() => setHistoryPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}
