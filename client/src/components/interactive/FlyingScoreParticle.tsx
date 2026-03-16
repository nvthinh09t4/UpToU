import { useEffect, useState } from 'react';

export interface FlyingParticle {
  id: number;
  value: number;
  x: number;
  y: number;
  ex: number;
  ey: number;
  color: string;
}

interface Props {
  item: FlyingParticle;
  onDone: () => void;
}

export function FlyingScoreParticle({ item, onDone }: Props) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // double-rAF: ensure initial position is painted before triggering the transition
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setActive(true)));
    const cleanup = setTimeout(onDone, 1600);
    return () => { cancelAnimationFrame(raf); clearTimeout(cleanup); };
    // onDone is stable from the parent's inline arrow that closes over stable state setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span
      style={{
        position: 'fixed', left: 0, top: 0, pointerEvents: 'none', zIndex: 9999,
        transform: `translate(${active ? item.ex : item.x}px, ${active ? item.ey : item.y}px)`,
        opacity: active ? 0 : 1,
        transition: active
          ? 'transform 1.2s cubic-bezier(.22,1,.36,1), opacity 0.35s 0.9s ease'
          : 'none',
        color: item.color,
        fontSize: '15px', fontWeight: 800, lineHeight: 1,
        textShadow: `0 0 10px ${item.color}99, 0 2px 4px rgba(0,0,0,0.9)`,
        willChange: 'transform, opacity',
      }}
    >
      {item.value > 0 ? '+' : ''}{item.value}
    </span>
  );
}
