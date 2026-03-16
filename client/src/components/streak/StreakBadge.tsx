import { useQuery } from '@tanstack/react-query';
import { streakApi } from '../../services/streakApi';

interface Props {
  className?: string;
  showLabel?: boolean;
}

export function StreakBadge({ className = '', showLabel = true }: Props) {
  const { data: streak } = useQuery({
    queryKey: ['my-streak'],
    queryFn: streakApi.getMyStreak,
    staleTime: 60_000,
  });

  if (!streak || streak.currentStreak === 0) return null;

  const color = streak.currentStreak >= 30
    ? '#f97316'
    : streak.currentStreak >= 7
    ? '#f59e0b'
    : '#fbbf24';

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span
        className="text-lg leading-none"
        style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
      >
        🔥
      </span>
      <span
        className="text-sm font-bold tabular-nums"
        style={{ color }}
      >
        {streak.currentStreak}
      </span>
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          day streak
        </span>
      )}
    </div>
  );
}
