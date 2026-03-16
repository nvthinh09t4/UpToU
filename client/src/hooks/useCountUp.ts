import { useEffect, useState } from 'react';

export function useCountUp(target: number, duration = 1500, delayMs = 0): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    setValue(0);
    let rafId: number;
    let startTime: number | null = null;
    const timeout = setTimeout(() => {
      const tick = (ts: number) => {
        if (startTime === null) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setValue(Math.round(target * eased));
        if (progress < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }, delayMs);
    return () => { clearTimeout(timeout); cancelAnimationFrame(rafId); };
  }, [target, duration, delayMs]);

  return value;
}
