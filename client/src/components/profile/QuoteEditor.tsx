import { useState } from 'react';
import { Check, Edit3, Quote, X } from 'lucide-react';

export function QuoteEditor({ currentQuote, onSave }: { currentQuote: string | null; onSave: (q: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentQuote ?? '');

  if (!editing) {
    return (
      <div className="group flex items-start gap-2">
        <Quote className="mt-0.5 h-4 w-4 flex-shrink-0 opacity-40" />
        <p className={`flex-1 text-sm italic ${currentQuote ? 'opacity-75' : 'opacity-30'}`}>
          {currentQuote ?? 'Add a favourite quote…'}
        </p>
        <button onClick={() => { setValue(currentQuote ?? ''); setEditing(true); }}
          className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
          <Edit3 className="h-3.5 w-3.5 opacity-50 hover:opacity-100" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea value={value} onChange={(e) => setValue(e.target.value.slice(0, 200))}
        placeholder="Your favourite quote (max 200 chars)" autoFocus rows={2}
        className="w-full resize-none rounded-lg bg-white/10 px-3 py-2 text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/40 text-white" />
      <div className="flex items-center justify-between">
        <span className="text-xs opacity-30">{value.length}/200</span>
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1 text-xs opacity-70 hover:opacity-100">
            <X className="h-3 w-3" /> Cancel
          </button>
          <button onClick={() => { onSave(value); setEditing(false); }}
            className="flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30">
            <Check className="h-3 w-3" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
