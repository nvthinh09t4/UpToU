import { useEffect, useState } from 'react';

export function useTypewriter(text: string, msPerChar = 14): { displayed: string; done: boolean } {
  const [length, setLength] = useState(0);

  useEffect(() => {
    setLength(0);
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setLength(i);
      if (i >= text.length) clearInterval(id);
    }, msPerChar);
    return () => clearInterval(id);
  }, [text, msPerChar]);

  return { displayed: text.slice(0, length), done: length >= text.length };
}
