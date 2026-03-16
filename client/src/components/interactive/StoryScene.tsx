import { useTypewriter } from '../../hooks/useTypewriter';
import { getYouTubeId } from '../../utils/videoUtils';
import type { PlayerStoryNode } from '../../types/storyNode';

function stringToHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
  return h % 360;
}

interface Props {
  node: PlayerStoryNode;
  lang?: string;
}

export function StoryScene({ node, lang }: Props) {
  const ytId = node.videoUrl ? getYouTubeId(node.videoUrl) : null;
  const questionText = lang === 'vi' ? (node.questionVi ?? node.question) : node.question;
  const subtitleText = lang === 'vi' ? (node.questionSubtitleVi ?? node.questionSubtitle) : node.questionSubtitle;
  const { displayed: question, done: typingDone } = useTypewriter(questionText);
  const hasImage = !!node.backgroundImageUrl;
  const hasVideo = !!node.videoUrl;

  const hue       = stringToHue(questionText);
  const accentDim  = `hsla(${hue}, 70%, 45%, 0.10)`;
  const accentGlow = `hsla(${hue}, 70%, 55%, 0.05)`;

  const questionPanel = (
    <div
      className="rounded-2xl px-6 py-5"
      style={{
        background: 'rgba(4,6,16,0.72)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/60">
        Your situation
      </p>
      <h2 className="text-xl font-bold leading-snug text-white sm:text-2xl">
        {question}
        {!typingDone && (
          <span className="blink-cursor ml-0.5 inline-block text-indigo-400">▎</span>
        )}
      </h2>
      {typingDone && subtitleText && (
        <p className="mt-2.5 text-base italic text-white/55" style={{ animation: 'isv-fade 0.5s ease both' }}>
          {subtitleText}
        </p>
      )}
    </div>
  );

  // ── No media background ──────────────────────────────────────────────────
  if (!hasImage && !hasVideo) {
    return (
      <div
        className="relative flex flex-1 flex-col overflow-hidden"
        style={{ backgroundColor: node.backgroundColor ?? '#080c14' }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 30% 40%, ${accentGlow} 0%, transparent 60%),
                         radial-gradient(ellipse at 70% 60%, hsla(${(hue + 40) % 360}, 60%, 40%, 0.08) 0%, transparent 55%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            left: '10%', top: '15%', width: '220px', height: '220px', borderRadius: '50%',
            background: `radial-gradient(circle, ${accentGlow} 0%, transparent 70%)`,
            filter: 'blur(30px)', animation: 'orb-float 7s ease-in-out infinite',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            right: '8%', top: '30%', width: '160px', height: '160px', borderRadius: '50%',
            background: `radial-gradient(circle, hsla(${(hue + 60) % 360}, 60%, 55%, 0.1) 0%, transparent 70%)`,
            filter: 'blur(24px)', animation: 'orb-float 9s ease-in-out infinite', animationDelay: '-4s',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{
            width: '180px', height: '180px', borderRadius: '50%',
            border: `1px solid ${accentDim}`,
            boxShadow: `0 0 60px ${accentGlow}, inset 0 0 40px ${accentGlow}`,
            animation: 'orb-float 11s ease-in-out infinite', animationDelay: '-2s',
          }} />
        </div>
        <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-8">
          {questionPanel}
        </div>
      </div>
    );
  }

  // ── Image / video background ─────────────────────────────────────────────
  return (
    <div className="relative flex-1 overflow-hidden" style={{ backgroundColor: node.backgroundColor ?? '#0f172a' }}>
      {hasImage && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${node.backgroundImageUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            animation: 'ken-burns 18s ease-in-out both', willChange: 'transform',
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/90" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-black/35" />
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: '65%', background: 'linear-gradient(to bottom, transparent, rgba(4,6,16,0.55) 50%, rgba(4,6,16,0.9) 100%)' }}
      />
      {ytId ? (
        <div className="absolute inset-x-0 top-1/2 z-10 mx-auto w-full max-w-md -translate-y-1/2 overflow-hidden rounded-xl shadow-2xl">
          <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0`} title="video" className="aspect-video w-full" allowFullScreen />
        </div>
      ) : node.videoUrl ? (
        <div className="absolute inset-x-0 top-1/2 z-10 mx-auto w-full max-w-md -translate-y-1/2 overflow-hidden rounded-xl shadow-2xl">
          <video src={node.videoUrl} controls className="aspect-video w-full" />
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-6 pt-10">{questionPanel}</div>
    </div>
  );
}
