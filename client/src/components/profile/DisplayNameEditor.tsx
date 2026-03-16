import { useState } from 'react';
import { Check, Type, X } from 'lucide-react';

function formatExpiry(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (d <= new Date()) return null;
  const diffMs = d.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return 'expires today';
  if (diffDays <= 7) return `expires in ${diffDays} days`;
  return `expires ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function DisplayNameEditor({
  currentName, expiresAt, onSave,
}: {
  currentName: string | null;
  expiresAt: string | null;
  onSave: (n: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentName ?? '');

  const expiry = formatExpiry(expiresAt);
  const isExpired = expiresAt !== null && new Date(expiresAt) <= new Date();
  const activeName = isExpired ? null : currentName;

  if (!open) {
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={() => { setValue(activeName ?? ''); setOpen(true); }}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/30 px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-white/60 hover:text-white"
        >
          <Type className="h-3 w-3" />
          {activeName ? `Display name: "${activeName}"` : 'Set display name (use ticket)'}
        </button>
        {activeName && expiry && (
          <p className="pl-1 text-[10px] text-white/40">{expiry}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, 100))}
        placeholder="Your display name (max 100 chars)"
        autoFocus
        maxLength={100}
        className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/40 text-white"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs opacity-30">{value.length}/100</span>
        <div className="flex gap-2">
          <button onClick={() => setOpen(false)}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1 text-xs opacity-70 hover:opacity-100">
            <X className="h-3 w-3" /> Cancel
          </button>
          <button onClick={() => { onSave(value); setOpen(false); }}
            className="flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30">
            <Check className="h-3 w-3" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
