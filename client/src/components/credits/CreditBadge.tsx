import { Link } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function CreditBadge() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <Link
      to="/rewards"
      title="Your credits & rewards"
      className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
    >
      <Coins className="h-3.5 w-3.5" />
      {user.creditBalance.toLocaleString()}
    </Link>
  );
}
