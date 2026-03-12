import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Coins } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/authApi';

export function CreditBadge() {
  const user = useAuthStore((s) => s.user);

  // Use all-time credits so badge matches the leaderboard ranking.
  // staleTime matches the dashboard query — result is shared from the cache.
  const { data: stats } = useQuery({
    queryKey: ['my-stats'],
    queryFn: () => authApi.myStats().then((r) => r.data),
    enabled: !!user,
    staleTime: 60_000,
  });

  if (!user) return null;

  const allTime = stats?.allTimeCredits ?? user.creditBalance;
  const balance = user.creditBalance;

  return (
    <Link
      to="/rewards"
      title={`All-time credits: ${allTime.toLocaleString()} · Spendable balance: ${balance.toLocaleString()}`}
      className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
    >
      <Coins className="h-3.5 w-3.5" />
      {allTime.toLocaleString()}
    </Link>
  );
}
