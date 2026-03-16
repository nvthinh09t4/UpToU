import { Star } from 'lucide-react';

export const RANK_ICONS: Record<string, string> = {
  Herald: '⚔️', Guardian: '🛡️', Crusader: '⚜️', Archon: '🔱',
  Legend: '👑', Ancient: '🌙', Divine: '✨', Immortal: '🔥',
};

export function RankMedal({ rankName, stars, color, size = 'lg' }: {
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
