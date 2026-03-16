import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Trophy, Coins, BookOpen, Zap, Play,
} from 'lucide-react';
import { categoryApi } from '../services/categoryApi';
import { leaderboardApi } from '../services/leaderboardApi';
import { SEOHead, JsonLd } from '../components/SEOHead';
import { CategoryNav } from '../components/layout/CategoryNav';
import { AppHeader } from '../components/layout/AppHeader';
import { Button } from '../components/ui/button';
import { RecommendationPanel } from '../components/story/RecommendationPanel';
import { useAuthStore } from '../store/authStore';
import { CATEGORY_CONFIG, FALLBACK_CATEGORY_CONFIG } from '../constants/categoryConfig';
import { SITE_URL } from '../constants/siteConfig';
const websiteSchema = {
  '@context': 'https://schema.org', '@type': 'WebSite',
  name: 'UpToU', url: SITE_URL,
  description: 'Read curated stories, interact with content, earn credits and level up.',
};


const RANKS = [
  { name: 'Bronze',      color: '#cd7f32', min: 0 },
  { name: 'Silver',      color: '#94a3b8', min: 500 },
  { name: 'Gold',        color: '#f59e0b', min: 1500 },
  { name: 'Platinum',    color: '#67e8f9', min: 4000 },
  { name: 'Diamond',     color: '#a78bfa', min: 10000 },
  { name: 'Master',      color: '#f472b6', min: 25000 },
  { name: 'Grandmaster', color: '#fb923c', min: 60000 },
  { name: 'Legend',      color: '#facc15', min: 120000 },
];

const MEDAL_COLORS = ['#f59e0b', '#94a3b8', '#b45309'];

export function HomePage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
    staleTime: 5 * 60_000,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard-home'],
    queryFn: () => leaderboardApi.getOverall('AllTime', 3),
    staleTime: 5 * 60_000,
  });

  const rootCats = categories.filter((c) => c.parentId === null).slice(0, 5);
  const topPlayers = leaderboard?.entries.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        description="UpToU — Read curated stories, interact with content, earn credits and level up."
        url={SITE_URL}
      />
      <JsonLd data={websiteSchema} />
      <AppHeader />
      <CategoryNav />

      {/* ── HERO — dark, split layout ─────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(160deg,#080c14 60%,#0f172a)' }} className="relative overflow-hidden border-b">
        {/* ambient glows */}
        <div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 py-24 sm:px-6 sm:py-32 lg:flex-row lg:py-40">
          {/* LEFT — copy */}
          <div className="flex-1 text-center lg:text-left">
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-400">
              <Zap className="h-3 w-3" /> {t('home.hero.badge')}
            </span>
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              {t('home.hero.title')}{' '}
              <br className="hidden sm:block" />
              <span style={{ background: 'linear-gradient(90deg,#818cf8,#c084fc,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {t('home.hero.titleAccent')}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg lg:mx-0">
              {t('home.hero.subtitle')}
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
              <Link to={isAuthenticated ? '/leaderboard' : '/register'}>
                <Button size="lg" className="gap-2 rounded-full px-8 text-base font-bold text-white shadow-xl"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none' }}>
                  {t('home.hero.cta')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#categories">
                <Button size="lg" variant="outline" className="gap-2 rounded-full border-white/20 px-8 text-base text-white/80 hover:border-white/40 hover:text-white">
                  <Play className="h-4 w-4" /> {t('home.hero.ctaSecondary')}
                </Button>
              </a>
            </div>
          </div>

          {/* RIGHT — floating category tiles */}
          <div className="grid w-full max-w-xs grid-cols-2 gap-3 lg:max-w-sm">
            {(['Finance', 'Technology', 'Self Improvement', 'Fiction', 'Real Life'] as const).map((name, i) => {
              const cfg = CATEGORY_CONFIG[name] ?? FALLBACK_CATEGORY_CONFIG;
              const Icon = cfg.icon;
              return (
                <div key={name}
                  className={`rounded-2xl p-4 ${i === 2 ? 'col-span-2' : ''}`}
                  style={{ background: `linear-gradient(135deg,${cfg.from},${cfg.to})`, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xl">{cfg.emoji}</span>
                  <p className="mt-2 text-xs font-bold text-white/90">{name}</p>
                  <Icon className="mt-1 h-3.5 w-3.5 text-white/40" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES — bento grid ───────────────────────────────────── */}
      <section id="categories" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('home.categories.title')}</h2>
          <p className="mt-2 text-muted-foreground">{t('home.categories.subtitle')}</p>
        </div>

        {catsLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`animate-pulse rounded-2xl bg-muted ${i === 0 || i === 3 ? 'col-span-2' : ''} h-44`} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {rootCats.map((cat, i) => {
              const cfg = CATEGORY_CONFIG[cat.title] ?? FALLBACK_CATEGORY_CONFIG;
              const Icon = cfg.icon;
              const isWide = i === 0 || i === 3;
              return (
                <Link key={cat.id} to={`/categories/${cat.id}`}
                  className={`group relative overflow-hidden rounded-2xl p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl ${isWide ? 'col-span-2' : 'col-span-1'}`}
                  style={{ background: `linear-gradient(135deg,${cfg.from},${cfg.to})`, minHeight: 180 }}>
                  {/* hover shine */}
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.08),transparent 55%)' }} />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="text-3xl">{cfg.emoji}</span>
                      <Icon className="h-5 w-5 text-white/20" />
                    </div>
                    <div className="mt-auto pt-8">
                      <h3 className="text-xl font-extrabold text-white">{cat.title}</h3>
                      {cat.description && <p className="mt-1.5 line-clamp-1 text-sm text-white/55">{cat.description}</p>}
                      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white/70 transition-all group-hover:gap-2.5 group-hover:text-white">
                        Explore stories <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── RECOMMENDATIONS ──────────────────────────────────────────── */}
      <RecommendationPanel />

      {/* ── INTERACTIVE STORIES — feature panel ──────────────────────── */}
      <section className="border-y" style={{ background: 'linear-gradient(160deg,#080c14,#0f172a 70%,#080c14)' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 py-20 sm:px-6 lg:flex-row lg:gap-16">
          {/* text */}
          <div className="flex-1">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-400">
              <Sparkles className="h-3 w-3" /> Interactive Stories
            </span>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Your choices<br />shape the outcome
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50">
              Dive into branching narratives across Finance, Career, and more. Every decision
              leads somewhere different — earn score points, unlock badges, and compare your
              path with thousands of other readers.
            </p>
            <Link to="/categories" className="mt-7 inline-block">
              <Button size="lg" className="gap-2 rounded-full font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none' }}>
                <Play className="h-4 w-4" /> Start a Story
              </Button>
            </Link>
          </div>
          {/* mock story choice UI */}
          <div className="w-full max-w-sm rounded-2xl p-5 lg:flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/30">Current scenario</p>
            <p className="text-sm font-semibold leading-snug text-white/90">
              Your manager asks you to present the financial strategy to the board tomorrow. How do you prepare?
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              {["Review last quarter's data and build slides", 'Ask a senior colleague for advice first', 'Draft a proposal from memory and refine'].map((opt, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-medium text-white/70 transition-colors"
                  style={{ background: i === 0 ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 0 ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}` }}>
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                    style={{ background: i === 0 ? '#6366f1' : 'rgba(255,255,255,0.1)', color: '#fff' }}>{i + 1}</span>
                  {opt}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-500/20 px-4 py-2.5">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-white/60">+15 points on choice 1</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── RANKS — 8-tier progression ───────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Climb the ranks</h2>
          <p className="mt-2 text-muted-foreground">Read, engage, and earn credits to unlock new tiers</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {RANKS.map((rank, i) => (
            <div key={rank.name} className="flex items-center gap-2.5 rounded-full border border-border bg-background px-4 py-2.5 shadow-sm">
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: rank.color, boxShadow: `0 0 8px ${rank.color}60` }} />
              <span className="text-xs font-bold" style={{ color: rank.color }}>{rank.name}</span>
              <span className="text-[10px] text-muted-foreground">{rank.min >= 1000 ? `${rank.min / 1000}K` : rank.min}+ cr</span>
              {i < RANKS.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/30" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── LEADERBOARD — podium top 3 ───────────────────────────────── */}
      {topPlayers.length > 0 && (
        <section className="border-t bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Top readers</h2>
                <p className="mt-2 text-muted-foreground">The community's highest earners this month</p>
              </div>
              <Link to="/leaderboard" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex">
                Full leaderboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {/* Podium: 2nd, 1st, 3rd */}
            <div className="flex items-end justify-center gap-4">
              {([1, 0, 2] as const).map((idx) => {
                const entry = topPlayers[idx];
                if (!entry) return null;
                const isFirst = idx === 0;
                const color = MEDAL_COLORS[idx];
                return (
                  <div key={entry.userId}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-background px-8 py-7 shadow-sm transition-shadow hover:shadow-md"
                    style={{ borderTopColor: color, borderTopWidth: 3, minWidth: isFirst ? 200 : 160, paddingBottom: isFirst ? 32 : 24 }}>
                    {isFirst && <Trophy className="h-6 w-6" style={{ color }} />}
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-xl font-black text-white"
                        style={{ background: `linear-gradient(135deg,${color},${color}80)` }}>
                        {entry.avatarUrl
                          ? <img src={entry.avatarUrl} alt={entry.displayName} className="h-full w-full object-cover" />
                          : entry.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background text-xs font-black text-white"
                        style={{ background: color }}>{entry.rank}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold">{entry.displayName}</p>
                      {entry.activeTitle && <p className="text-xs text-muted-foreground">{entry.activeTitle}</p>}
                      <div className="mt-1.5 flex items-center justify-center gap-1">
                        <Coins className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-sm font-extrabold" style={{ color }}>{entry.totalCredits.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed 50%,#0ea5e9)' }}>
          <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
            <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{t('home.cta.button')}</h2>
            <p className="mx-auto mt-4 max-w-lg text-white/70 sm:text-lg">{t('home.cta.subtitle')}</p>
            <div className="mt-9 flex flex-col items-center gap-3">
              <Link to="/register">
                <Button size="lg" className="rounded-full bg-white px-12 text-base font-extrabold text-indigo-700 shadow-xl hover:bg-white/95">
                  {t('home.cta.button')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <p className="text-sm text-white/60">
                {t('home.cta.orSignIn')}{' '}
                <Link to="/login" className="font-bold text-white underline underline-offset-2">{t('home.cta.signIn')}</Link>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div>
            <span className="font-extrabold text-foreground">UpToU</span>
            <span className="ml-2 text-xs">Read. React. Grow.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">{t('footer.privacy')}</a>
            <a href="#" className="hover:text-foreground">{t('footer.terms')}</a>
            <a href="#" className="hover:text-foreground">{t('footer.contact')}</a>
          </div>
          <span className="text-xs">{t('footer.rights', { year: new Date().getFullYear() })}</span>
        </div>
      </footer>
    </div>
  );
}
