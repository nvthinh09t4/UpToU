import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, MessageCircle, Trophy, ArrowRight, Coins } from 'lucide-react';
import { categoryApi } from '../services/categoryApi';
import { SEOHead, JsonLd } from '../components/SEOHead';
import { CategoryNav } from '../components/layout/CategoryNav';
import { AppHeader } from '../components/layout/AppHeader';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';

const STATS = [
  { value: '50,000+', key: 'readers' },
  { value: '1,200+', key: 'stories' },
  { value: '2.4M', key: 'credits' },
  { value: '8', key: 'ranks' },
] as const;

const STEP_ICONS = [BookOpen, MessageCircle, Coins] as const;
const STEP_KEYS = ['read', 'react', 'earn'] as const;

const CATEGORY_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
];

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://uptou.com';

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'UpToU',
  url: SITE_URL,
  description: 'Read curated stories, interact with content, earn credits and level up across finance, health, technology and more.',
};

export function HomePage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
    staleTime: 5 * 60_000,
  });

  const topCategories = categories.filter((c) => c.parentId === null).slice(0, 6);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        description="UpToU — Read curated stories, interact with content, earn credits and level up across finance, health, technology and more."
        url={SITE_URL}
      />
      <JsonLd data={websiteSchema} />

      <AppHeader />
      <CategoryNav />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 to-background">
        {/* subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 sm:py-36">
          <span className="mb-6 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            {t('home.hero.badge')}
          </span>
          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-7xl">
            {t('home.hero.title')}{' '}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('home.hero.titleAccent')}
            </span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {t('home.hero.subtitle')}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to={isAuthenticated ? '/leaderboard' : '/register'}>
              <Button size="lg" className="gap-2 px-8 text-base shadow-md">
                {t('home.hero.cta')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#categories">
              <Button size="lg" variant="outline" className="px-8 text-base">
                {t('home.hero.ctaSecondary')}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px sm:grid-cols-4">
          {STATS.map(({ value, key }) => (
            <div key={key} className="flex flex-col items-center py-10">
              <span className="text-3xl font-extrabold text-foreground sm:text-4xl">{value}</span>
              <span className="mt-1.5 text-sm text-muted-foreground">{t(`home.stats.${key}`)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('home.howItWorks.title')}
          </h2>
          <p className="mt-3 text-muted-foreground">{t('home.howItWorks.subtitle')}</p>
        </div>

        <div className="relative grid gap-8 sm:grid-cols-3">
          {/* connector line */}
          <div className="absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] hidden h-px bg-border sm:block" />

          {STEP_KEYS.map((key, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <div key={key} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                  <Icon className="h-7 w-7 text-primary" />
                  <span className="absolute -top-2.5 -right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {t(`home.howItWorks.${key}.step`)}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold">{t(`home.howItWorks.${key}.title`)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`home.howItWorks.${key}.desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────── */}
      <section id="categories" className="border-t bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('home.categories.title')}
              </h2>
              <p className="mt-2 text-muted-foreground">{t('home.categories.subtitle')}</p>
            </div>
          </div>

          {catsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topCategories.map((cat, i) => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.id}`}
                  className="group relative overflow-hidden rounded-2xl p-6 transition-transform hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} opacity-90`}
                  />
                  <div className="relative">
                    <h3 className="text-lg font-bold text-white">{cat.title}</h3>
                    {cat.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-white/80">{cat.description}</p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-white/90 transition-gap group-hover:gap-2">
                      {t('home.categories.viewAll')} <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Leaderboard teaser + CTA ─────────────────────────────────── */}
      <section className="border-t bg-primary text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <Trophy className="mx-auto mb-5 h-12 w-12 opacity-80" />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('home.cta.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 sm:text-lg">
            {t('home.cta.subtitle')}
          </p>
          {isAuthenticated ? (
            <Link to="/leaderboard">
              <Button
                size="lg"
                variant="secondary"
                className="mt-8 gap-2 px-10 text-base shadow-md"
              >
                {t('nav.leaderboard')} <Trophy className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="gap-2 px-10 text-base shadow-md">
                  {t('home.cta.button')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <p className="text-sm text-primary-foreground/70">
                {t('home.cta.orSignIn')}{' '}
                <Link to="/login" className="font-semibold underline underline-offset-2 hover:text-primary-foreground">
                  {t('home.cta.signIn')}
                </Link>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t bg-muted/20">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <span className="font-semibold text-foreground">UpToU</span>
          <span>{t('footer.rights', { year: new Date().getFullYear() })}</span>
          <div className="flex gap-4">
            <a href="#" className="transition-colors hover:text-foreground">{t('footer.privacy')}</a>
            <a href="#" className="transition-colors hover:text-foreground">{t('footer.terms')}</a>
            <a href="#" className="transition-colors hover:text-foreground">{t('footer.contact')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
