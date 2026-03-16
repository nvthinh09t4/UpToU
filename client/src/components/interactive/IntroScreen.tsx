import { Play, Sparkles } from 'lucide-react';
import { useWordReveal } from '../../hooks/useWordReveal';

interface Props {
  storyTitle: string;
  backgroundImageUrl: string | null;
  backgroundColor: string | null;
  onBegin: () => void;
}

export function IntroScreen({ storyTitle, backgroundImageUrl, backgroundColor, onBegin }: Props) {
  const words    = storyTitle.split(' ');
  const revealed = useWordReveal(storyTitle, 120);

  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden"
      style={{
        backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
        backgroundColor: backgroundColor ?? '#0b0f1e',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}
    >
      {backgroundImageUrl && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            animation: 'ken-burns 22s ease-in-out both',
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/95" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 35%, transparent 25%, rgba(0,0,0,0.6) 100%)' }} />
      <div className="absolute pointer-events-none" style={{ left: '15%', top: '20%', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(24px)', animation: 'orb-float 6s ease-in-out infinite' }} />
      <div className="absolute pointer-events-none" style={{ right: '12%', top: '35%', width: '140px', height: '140px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)', filter: 'blur(20px)', animation: 'orb-float 8s ease-in-out infinite', animationDelay: '-3s' }} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: '340px', height: '220px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.22) 0%, transparent 70%)', filter: 'blur(28px)' }} />

      <div className="relative z-10 mt-auto flex flex-col items-center px-8 pb-16 pt-10 text-center" style={{ animation: 'isv-fade 1.2s ease both' }}>
        <div className="mb-6 flex items-center gap-1.5 rounded-full px-4 py-1.5" style={{ background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.35)' }}>
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300/80">Interactive Story</span>
        </div>

        <h1 className="mb-3 text-4xl font-extrabold leading-tight text-white" style={{ textShadow: '0 2px 28px rgba(0,0,0,0.95)' }}>
          {words.map((word, i) => (
            <span
              key={i}
              className="inline-block"
              style={{
                marginRight: i < words.length - 1 ? '0.3em' : 0,
                opacity: revealed[i] ? 1 : 0,
                transform: revealed[i] ? 'translateY(0)' : 'translateY(12px)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
              }}
            >
              {word}
            </span>
          ))}
        </h1>

        <div className="mb-4 h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)', animation: 'isv-fade 0.8s 0.6s ease both' }} />
        <p className="mb-10 max-w-xs text-base leading-relaxed text-white/40" style={{ animation: 'isv-fade 0.8s 0.8s ease both' }}>
          Every decision carries weight. Your path is yours alone.
        </p>

        <button
          onClick={onBegin}
          className="adventure-btn group relative overflow-hidden rounded-2xl px-12 py-4 text-base font-bold text-white transition-transform duration-200 hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)', animation: 'isv-fade 0.6s 1s ease both, btn-pulse 2.4s 1.5s ease-in-out infinite' }}
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <span className="relative flex items-center gap-2.5">
            <Play className="h-5 w-5 fill-white" />
            Begin Adventure
          </span>
        </button>
      </div>
    </div>
  );
}
