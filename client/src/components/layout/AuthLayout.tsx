import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Zap, TrendingUp, Trophy } from 'lucide-react';

const FEATURES = [
  { icon: BookOpen,    text: 'Curated stories across Finance, Tech, Health & more' },
  { icon: TrendingUp, text: 'Earn credits by reading, reacting, and engaging' },
  { icon: Trophy,     text: 'Climb 8 rank tiers and appear on the leaderboard' },
  { icon: Zap,        text: 'Interactive stories where your choices matter' },
];

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left — brand panel (desktop only) */}
      <div
        className="relative hidden w-2/5 flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14"
        style={{ background: 'linear-gradient(160deg,#080c14 60%,#0f172a)' }}
      >
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />

        {/* Logo */}
        <Link to="/" className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-extrabold text-white">UpToU</span>
        </Link>

        {/* Middle */}
        <div className="relative">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-400">
            Why join UpToU?
          </p>
          <h2 className="mb-8 text-3xl font-extrabold leading-tight text-white xl:text-4xl">
            Read smarter.<br />Grow faster.<br />
            <span style={{ background: 'linear-gradient(90deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Earn rewards.
            </span>
          </h2>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
                  <Icon className="h-3.5 w-3.5 text-violet-400" />
                </div>
                <span className="text-sm leading-relaxed text-white/60">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-white/25">
          © {new Date().getFullYear()} UpToU. Read. React. Grow.
        </p>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        {/* Mobile logo */}
        <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-extrabold"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            UpToU
          </span>
        </Link>

        <div className="w-full max-w-sm">
          <h1 className="mb-2 text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            {subtitle ?? 'Start your journey today.'}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}
