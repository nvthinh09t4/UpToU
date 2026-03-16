import { Coins, Crown, Medal, PenLine, Star, Users } from 'lucide-react';
import { RANK_TIERS } from '../../utils/rankHelper';
import type { ContributorLeaderboardEntry, LeaderboardEntry } from '../../types/leaderboard';

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

function UserAvatar({ entry }: { entry: Pick<LeaderboardEntry, 'displayName' | 'avatarUrl' | 'activeAvatarFrameUrl'> }) {
  const initial = entry.displayName.charAt(0).toUpperCase();

  return (
    <div className="relative flex-shrink-0">
      {entry.activeAvatarFrameUrl ? (
        <div className="relative h-10 w-10">
          <img src={entry.activeAvatarFrameUrl} alt="" className="absolute inset-0 h-full w-full" />
          {entry.avatarUrl ? (
            <img src={entry.avatarUrl} alt={entry.displayName} className="absolute inset-1 h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="absolute inset-1 flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 text-sm font-bold text-violet-600">
              {initial}
            </div>
          )}
        </div>
      ) : entry.avatarUrl ? (
        <img src={entry.avatarUrl} alt={entry.displayName} className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10 text-sm font-bold text-violet-600">
          {initial}
        </div>
      )}
    </div>
  );
}

export function LeaderboardRow({ entry, showActivity }: { entry: LeaderboardEntry; showActivity?: boolean }) {
  const isTop3 = entry.rank <= 3;
  const rankColor = RANK_TIERS.find((t) => t.name === entry.rankName)?.color ?? '#9e9e9e';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 transition-colors ${isTop3 ? 'bg-amber-500/5' : 'hover:bg-muted/40'}`}
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
            <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {entry.activeTitle}
            </span>
          )}
        </div>
        {entry.mentionHandle && (
          <span className="text-xs text-muted-foreground">@{entry.mentionHandle}</span>
        )}
      </div>
      <div className="flex items-center gap-4 text-right">
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

export function ContributorRow({ entry }: { entry: ContributorLeaderboardEntry }) {
  const isTop3 = entry.rank <= 3;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 transition-colors ${isTop3 ? 'bg-emerald-500/5' : 'hover:bg-muted/40'}`}
      style={{ borderLeft: `3px solid ${entry.isChampion ? '#10b981' : '#6b7280'}` }}
    >
      <div className="flex w-8 items-center justify-center">
        <RankBadge rank={entry.rank} />
      </div>

      <UserAvatar entry={entry} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold truncate">{entry.displayName}</span>

          {entry.isChampion && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <Star className="h-2.5 w-2.5 fill-current" />
              Contributor Champion
            </span>
          )}

          {entry.activeTitle && entry.activeTitle !== '✍️ Contributor Champion' && (
            <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {entry.activeTitle}
            </span>
          )}
        </div>
        {entry.mentionHandle && (
          <span className="text-xs text-muted-foreground">@{entry.mentionHandle}</span>
        )}
      </div>

      <div className="flex items-center gap-4 text-right">
        <div className="hidden sm:block">
          <p className="text-xs text-muted-foreground">Readers</p>
          <p className="flex items-center gap-1 text-sm font-semibold text-sky-600 dark:text-sky-400">
            <Users className="h-3.5 w-3.5" />
            {entry.uniqueReaders.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Pts</p>
          <p className="flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            <PenLine className="h-3.5 w-3.5" />
            {entry.contributedPoints.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
