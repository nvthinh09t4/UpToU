import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bookmark, Check, Edit3, Gift, Lock,
  Medal, Quote, Star, Trophy, X, Zap,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/authApi';
import { getRank, RANK_TIERS } from '../utils/rankHelper';

// ── Rank medal ────────────────────────────────────────────────────────────────

const RANK_ICONS: Record<string, string> = {
  Herald: '⚔️', Guardian: '🛡️', Crusader: '⚜️', Archon: '🔱',
  Legend: '👑', Ancient: '🌙', Divine: '✨', Immortal: '🔥',
};

function RankMedal({ rankName, stars, color, size = 'lg' }: {
  rankName: string; stars: number; color: string; size?: 'sm' | 'lg';
}) {
  const lg = size === 'lg';
  const glow = rankName === 'Divine' || rankName === 'Immortal';
  const dim = lg ? { w: 120, h: 140, icon: 40 } : { w: 52, h: 60, icon: 17 };

  return (
    <div className={`flex flex-col items-center ${lg ? 'gap-3' : 'gap-1'}`}>
      <div
        className="relative flex items-center justify-center"
        style={{
          width: dim.w, height: dim.h,
          clipPath: 'polygon(50% 0%, 100% 15%, 100% 65%, 50% 100%, 0% 65%, 0% 15%)',
          background: glow
            ? `radial-gradient(ellipse at 40% 30%, ${color}ff, ${color}88)`
            : `linear-gradient(145deg, ${color}cc, ${color}66)`,
          boxShadow: glow ? `0 0 ${lg ? 28 : 12}px ${color}66` : undefined,
        }}
      >
        <div
          className="absolute"
          style={{
            inset: lg ? '10px 15px' : '5px 7px',
            clipPath: 'polygon(50% 0%, 100% 15%, 100% 65%, 50% 100%, 0% 65%, 0% 15%)',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <span className="relative z-10" style={{ fontSize: dim.icon, filter: glow ? 'drop-shadow(0 0 5px white)' : undefined }}>
          {RANK_ICONS[rankName] ?? '🏅'}
        </span>
      </div>
      <span className={`font-bold tracking-wide ${lg ? 'text-base' : 'text-[10px]'}`} style={{ color }}>
        {rankName}
      </span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={lg ? 'h-3.5 w-3.5' : 'h-2 w-2'}
            style={{ color: i < stars ? color : '#374151', fill: i < stars ? color : 'transparent' }} />
        ))}
      </div>
    </div>
  );
}

// ── Achievements ──────────────────────────────────────────────────────────────

function buildAchievements(credits: number, rankName: string, hasTitle: boolean, hasFrame: boolean, hasQuote: boolean) {
  const reached = (name: string) =>
    RANK_TIERS.findIndex((t) => t.name === rankName) >= RANK_TIERS.findIndex((t) => t.name === name);

  return [
    { id: 'welcome',  label: 'Welcome',      description: 'Joined UpToU',                     icon: '🌟', unlocked: true,              color: '#10b981' },
    { id: 'earner',   label: 'First Earner', description: 'Earned your first credits',         icon: '💰', unlocked: credits >= 1,      color: '#f59e0b' },
    { id: 'wealth',   label: 'Wealth',       description: 'Reached 500 all-time credits',      icon: '💎', unlocked: credits >= 500,    color: '#6366f1' },
    { id: 'rich',     label: 'Affluent',     description: 'Reached 2,500 all-time credits',    icon: '🏦', unlocked: credits >= 2500,   color: '#8b5cf6' },
    { id: 'guardian', label: 'Guardian',     description: 'Reached Guardian rank',             icon: '🛡️', unlocked: reached('Guardian'), color: '#4caf50' },
    { id: 'crusader', label: 'Crusader',     description: 'Reached Crusader rank',             icon: '⚜️', unlocked: reached('Crusader'), color: '#29b6f6' },
    { id: 'legend',   label: 'Legend',       description: 'Reached Legend rank',               icon: '👑', unlocked: reached('Legend'),   color: '#5c6bc0' },
    { id: 'ancient',  label: 'Ancient One',  description: 'Reached Ancient rank',              icon: '🌙', unlocked: reached('Ancient'),  color: '#7e57c2' },
    { id: 'divine',   label: 'Divine',       description: 'Reached Divine rank',               icon: '✨', unlocked: reached('Divine'),   color: '#ffd700' },
    { id: 'immortal', label: 'Immortal',     description: 'Reached Immortal rank',             icon: '🔥', unlocked: reached('Immortal'), color: '#ff5722' },
    { id: 'titled',   label: 'Titled',       description: 'Equipped an active title',          icon: '🏷️', unlocked: hasTitle,           color: '#ec4899' },
    { id: 'stylish',  label: 'Style Icon',   description: 'Equipped an avatar frame',          icon: '🖼️', unlocked: hasFrame,           color: '#14b8a6' },
    { id: 'quoted',   label: 'Philosopher',  description: 'Added a favourite quote',           icon: '💬', unlocked: hasQuote,           color: '#f97316' },
  ];
}

// ── Quote editor ──────────────────────────────────────────────────────────────

function QuoteEditor({ currentQuote, onSave }: { currentQuote: string | null; onSave: (q: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentQuote ?? '');

  if (!editing) {
    return (
      <div className="group flex items-start gap-2">
        <Quote className="mt-0.5 h-4 w-4 flex-shrink-0 opacity-40" />
        <p className={`flex-1 text-sm italic ${currentQuote ? 'opacity-75' : 'opacity-30'}`}>
          {currentQuote ?? 'Add a favourite quote…'}
        </p>
        <button onClick={() => { setValue(currentQuote ?? ''); setEditing(true); }}
          className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
          <Edit3 className="h-3.5 w-3.5 opacity-50 hover:opacity-100" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea value={value} onChange={(e) => setValue(e.target.value.slice(0, 200))}
        placeholder="Your favourite quote (max 200 chars)" autoFocus rows={2}
        className="w-full resize-none rounded-lg bg-white/10 px-3 py-2 text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/40 text-white" />
      <div className="flex items-center justify-between">
        <span className="text-xs opacity-30">{value.length}/200</span>
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1 text-xs opacity-70 hover:opacity-100">
            <X className="h-3 w-3" /> Cancel
          </button>
          <button onClick={() => { onSave(value); setEditing(false); }}
            className="flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30">
            <Check className="h-3 w-3" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['my-stats'],
    queryFn: () => authApi.myStats().then((r) => r.data),
    enabled: !!user,
  });

  const { mutate: saveQuote, isPending: savingQuote } = useMutation({
    mutationFn: (q: string) => authApi.updateProfile({ favoriteQuote: q }).then((r) => r.data),
    onSuccess: (updated) => {
      if (accessToken) setAuth(accessToken, updated);
      qc.invalidateQueries({ queryKey: ['my-stats'] });
    },
  });

  if (!user) return null;

  const allTimeCredits = stats?.allTimeCredits ?? user.creditBalance;
  const rank = getRank(allTimeCredits);
  const leaderPos = stats?.leaderboardPosition;
  const top20 = !!leaderPos && leaderPos <= 20;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const achievements = buildAchievements(allTimeCredits, rank.name, !!user.activeTitle, !!user.activeAvatarFrameUrl, !!user.favoriteQuote);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* ── Hero banner ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${rank.color}28 0%, ${rank.color}0a 60%, transparent 100%)`,
          borderBottom: `1px solid ${rank.color}20`,
        }}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl opacity-15"
          style={{ background: rank.color }} />

        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full text-2xl font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${rank.color}88, ${rank.color}44)`, boxShadow: `0 0 0 4px ${rank.color}44, 0 8px 32px ${rank.color}33` }}>
                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
              </div>
              {user.activeAvatarFrameUrl && (
                <img src={user.activeAvatarFrameUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-extrabold">{user.firstName} {user.lastName}</h1>
                {user.activeTitle && (
                  <span className="rounded-full px-3 py-0.5 text-xs font-semibold text-white"
                    style={{ background: rank.color }}>
                    {user.activeTitle}
                  </span>
                )}
              </div>
              {user.mentionHandle && (
                <p className="mt-0.5 text-sm text-muted-foreground">@{user.mentionHandle}</p>
              )}
              <div className="mt-3 max-w-sm">
                <QuoteEditor currentQuote={user.favoriteQuote} onSave={(q) => !savingQuote && saveQuote(q)} />
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                {[
                  { to: '/rewards', icon: <Gift className="h-3.5 w-3.5" />, label: 'Rewards' },
                  { to: '/bookmarks', icon: <Bookmark className="h-3.5 w-3.5" />, label: 'Bookmarks' },
                  { to: '/leaderboard', icon: <Trophy className="h-3.5 w-3.5" />, label: 'Leaderboard' },
                ].map((l) => (
                  <Link key={l.to} to={l.to}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    {l.icon} {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Rank card */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center rounded-2xl p-6"
              style={{ background: `linear-gradient(160deg, ${rank.color}15, ${rank.color}06)`, border: `1px solid ${rank.color}28` }}>
              <RankMedal rankName={rank.name} stars={rank.stars} color={rank.color} size="lg" />

              {/* Progress */}
              <div className="mt-5 w-full">
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>{rank.name} ★{rank.stars}</span>
                  <span className="truncate pl-2">{rank.nextLabel}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${rank.progressPct}%`, background: `linear-gradient(90deg, ${rank.color}88, ${rank.color})` }} />
                </div>
                <p className="mt-1 text-center text-xs text-muted-foreground">{rank.progressPct}% to next star</p>
              </div>

              {/* Tier list */}
              <div className="mt-5 w-full space-y-1">
                {RANK_TIERS.map((tier) => {
                  const reached = allTimeCredits >= tier.min;
                  const current = tier.name === rank.name;
                  return (
                    <div key={tier.name} className="flex items-center gap-2 rounded-lg px-2 py-1"
                      style={{ background: current ? `${tier.color}1a` : undefined }}>
                      <span style={{ fontSize: 13 }}>{RANK_ICONS[tier.name]}</span>
                      <span className="flex-1 text-xs font-medium"
                        style={{ color: reached ? tier.color : undefined, opacity: reached ? 1 : 0.3 }}>
                        {tier.name}{current && <span className="ml-1 text-[10px] opacity-60">← you</span>}
                      </span>
                      {reached
                        ? <Check className="h-3 w-3" style={{ color: tier.color }} />
                        : <Lock className="h-3 w-3 opacity-20" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6 lg:col-span-2">

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'All-Time Credits', value: allTimeCredits.toLocaleString(), icon: <Zap className="h-4 w-4" />, color: rank.color },
                { label: 'Balance', value: user.creditBalance.toLocaleString(), icon: <Gift className="h-4 w-4" />, color: '#f59e0b' },
                { label: 'Global Rank', value: leaderPos ? `#${leaderPos}${top20 ? ' 🏆' : ''}` : '—', icon: <Trophy className="h-4 w-4" />, color: top20 ? '#ffd700' : undefined },
                { label: 'Achievements', value: `${unlocked} / ${achievements.length}`, icon: <Medal className="h-4 w-4" />, color: '#8b5cf6' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-1.5" style={{ color: s.color ?? undefined }}>
                    {s.icon}
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                  </div>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Top 20 callout */}
            {top20 && (
              <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'linear-gradient(90deg,#ffd70018,#ff572218)', border: '1px solid #ffd70030' }}>
                <span style={{ fontSize: 26 }}>🏆</span>
                <div>
                  <p className="text-sm font-bold">You're #{leaderPos} in the Global Leaderboard!</p>
                  <p className="text-xs text-muted-foreground">Top 20 — keep earning credits to climb higher.</p>
                </div>
                <Link to="/leaderboard" className="ml-auto text-xs font-semibold text-primary hover:underline">View →</Link>
              </div>
            )}

            {/* Achievements */}
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Achievements · {unlocked}/{achievements.length}
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {achievements.map((a) => (
                  <div key={a.id} title={a.description}
                    className="flex items-center gap-2.5 rounded-xl border p-3 transition-all"
                    style={{
                      borderColor: a.unlocked ? `${a.color}40` : undefined,
                      background: a.unlocked ? `${a.color}0c` : undefined,
                      opacity: a.unlocked ? 1 : 0.4,
                    }}>
                    <span style={{ fontSize: 20, filter: a.unlocked ? undefined : 'grayscale(1)' }}>{a.icon}</span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{a.label}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{a.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rank milestones table */}
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Rank Milestones
              </h2>
              <div className="overflow-hidden rounded-xl border border-border">
                {RANK_TIERS.map((tier, i) => {
                  const reached = allTimeCredits >= tier.min;
                  const current = tier.name === rank.name;
                  return (
                    <div key={tier.name}
                      className={`flex items-center gap-4 px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}
                      style={{ background: current ? `${tier.color}0e` : undefined }}>
                      <RankMedal rankName={tier.name} stars={reached ? Math.min(5, 1 + Math.floor((allTimeCredits - tier.min) / tier.perStar)) : 1}
                        color={reached ? tier.color : '#374151'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold"
                          style={{ color: reached ? tier.color : undefined, opacity: reached ? 1 : 0.35 }}>
                          {tier.name}
                          {current && <span className="ml-2 text-xs font-normal text-muted-foreground">← current</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{tier.min.toLocaleString()} credits</p>
                      </div>
                      {reached
                        ? <Check className="h-4 w-4 flex-shrink-0" style={{ color: tier.color }} />
                        : <Lock className="h-4 w-4 flex-shrink-0 opacity-20" />}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
