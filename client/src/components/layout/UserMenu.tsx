import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Bell,
  ChevronRight,
  Gift,
  LogOut,
  Moon,
  Sun,
  Trophy,
  User,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/authApi';
import { useTheme } from '../../hooks/useTheme';

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();

  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  if (!user) return null;

  async function handleLogout() {
    setOpen(false);
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/');
  }

  const avatarBg = user.avatarUrl ? undefined : 'bg-primary text-primary-foreground';

  return (
    <div ref={ref} className="relative">
      {/* Avatar button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open user menu"
        aria-expanded={open}
        className={[
          'flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs font-bold ring-2 ring-transparent transition',
          'hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-primary',
          open ? 'ring-primary/50' : '',
          avatarBg ?? '',
        ].join(' ')}
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.firstName} className="h-full w-full object-cover" />
        ) : (
          initials(user.firstName, user.lastName)
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
          style={{ animation: 'um-drop 0.15s ease both' }}
        >
          <style>{`
            @keyframes um-drop {
              from { opacity: 0; transform: translateY(-6px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0)    scale(1); }
            }
          `}</style>

          {/* User card */}
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={[
                'flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold ring-2 ring-border',
                avatarBg ?? '',
              ].join(' ')}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(user.firstName, user.lastName)
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                {user.activeTitle && (
                  <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {user.activeTitle}
                  </span>
                )}
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="py-1">
            <MenuItem icon={<User className="h-4 w-4" />} label="My Profile" to="/dashboard" onClose={() => setOpen(false)} />
            <MenuItem icon={<Bookmark className="h-4 w-4" />} label="Bookmarks" to="/bookmarks" onClose={() => setOpen(false)} />
            <MenuItem icon={<Bell className="h-4 w-4" />} label="Notifications" to="/notifications" onClose={() => setOpen(false)} />
            <MenuItem icon={<Gift className="h-4 w-4" />} label="Rewards Shop" to="/rewards" onClose={() => setOpen(false)} />
            <MenuItem icon={<Trophy className="h-4 w-4" />} label="Leaderboard" to="/leaderboard" onClose={() => setOpen(false)} />
          </div>

          <div className="border-t border-border py-1">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-500" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-500" />
              )}
              <span className="flex-1 text-left">
                {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              </span>
              <span className="text-xs text-muted-foreground">
                {theme === 'dark' ? '☀️' : '🌙'}
              </span>
            </button>
          </div>

          <div className="border-t border-border py-1">
            {/* Log out */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon, label, to, onClose,
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
  onClose: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClose}
      className="flex items-center gap-3 px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
    </Link>
  );
}
