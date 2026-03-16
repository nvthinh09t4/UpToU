interface Props {
  label: string;
  value: number;
  delta?: number;
}

export function ScoreChip({ label, value, delta }: Props) {
  const isPos = value > 0;
  const isNeg = value < 0;
  const color = isPos ? '#4ade80' : isNeg ? '#f87171' : '#94a3b8';
  const bg    = isPos ? 'rgba(34,197,94,0.14)'  : isNeg ? 'rgba(239,68,68,0.14)'  : 'rgba(148,163,184,0.10)';
  const bdr   = isPos ? 'rgba(34,197,94,0.35)'  : isNeg ? 'rgba(239,68,68,0.35)'  : 'rgba(148,163,184,0.20)';
  const hasDelta   = delta !== undefined && delta !== 0;
  const deltaColor = (delta ?? 0) > 0 ? '#4ade80' : '#f87171';
  const flashGlow  = (delta ?? 0) > 0 ? 'rgba(74,222,128,0.55)' : 'rgba(248,113,113,0.55)';

  return (
    <div
      className="relative flex flex-col items-center rounded-lg px-3 py-1.5"
      style={{
        background: bg, border: `1px solid ${bdr}`, minWidth: '58px',
        animation: hasDelta ? 'chip-flash 0.55s ease both' : undefined,
        ['--flash' as string]: flashGlow,
      }}
      title={`${label}: ${value >= 0 ? '+' : ''}${value}`}
    >
      {hasDelta && (
        <span
          className="pointer-events-none absolute -top-5 left-1/2 text-sm font-extrabold tabular-nums"
          style={{
            transform: 'translateX(-50%)',
            color: deltaColor,
            animation: 'score-delta 1.5s ease-out both',
            textShadow: `0 0 10px ${flashGlow}`,
            whiteSpace: 'nowrap',
          }}
        >
          {(delta ?? 0) > 0 ? '+' : ''}{delta}
        </span>
      )}
      <span className="max-w-[60px] truncate text-[11px] font-semibold leading-tight" style={{ color: `${color}cc` }}>
        {label}
      </span>
      <span className="text-base font-extrabold tabular-nums leading-snug" style={{ color }}>
        {value > 0 ? '+' : ''}{value}
      </span>
    </div>
  );
}
