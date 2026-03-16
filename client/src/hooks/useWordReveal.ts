import { useEffect, useState } from 'react';

export function useWordReveal(text: string, delayBetween = 90): boolean[] {
  const words = text.split(' ');
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= words.length) clearInterval(id);
    }, delayBetween);
    return () => clearInterval(id);
  }, [text, delayBetween, words.length]);

  return words.map((_, idx) => idx < count);
}
