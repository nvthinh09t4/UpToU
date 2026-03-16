import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, BookOpen } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import { NotificationBell } from '../notifications/NotificationBell';
import { CreditBadge } from '../credits/CreditBadge';
import { UserMenu } from './UserMenu';

export function AppHeader() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left — logo + nav */}
        <div className="flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              UpToU
            </span>
          </Link>
          <Link
            to="/leaderboard"
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
          >
            <Trophy className="h-3.5 w-3.5" />
            {t('nav.leaderboard')}
          </Link>
        </div>

        {/* Right — auth */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <CreditBadge />
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button size="sm" variant="ghost" className="text-sm font-medium">
                  {t('nav.signIn')}
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="rounded-full px-4 text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none' }}>
                  Get started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
