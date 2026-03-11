import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import { NotificationBell } from '../notifications/NotificationBell';
import { CreditBadge } from '../credits/CreditBadge';
import { UserMenu } from './UserMenu';

export function AppHeader() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold tracking-tight">UpToU</Link>
          <Link
            to="/leaderboard"
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <CreditBadge />
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <Link to="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
