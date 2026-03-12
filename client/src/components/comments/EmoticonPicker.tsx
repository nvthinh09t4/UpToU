import { useEffect, useRef, useState } from 'react';
import { Smile } from 'lucide-react';
import { EMOTICONS } from './emoticons';

interface EmoticonPickerProps {
  onSelect: (emoji: string) => void;
}

export function EmoticonPicker({ onSelect }: EmoticonPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Insert emoticon"
        className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <Smile className="h-4.5 w-4.5" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-72 rounded-lg border border-border bg-popover p-2 shadow-lg">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Emoticons</p>
          <div className="grid grid-cols-8 gap-0.5">
            {EMOTICONS.map((e) => (
              <button
                key={e.shortcut}
                type="button"
                title={`${e.label}  ${e.shortcut}`}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  onSelect(e.shortcut);
                  setOpen(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-accent transition-colors"
              >
                {e.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
