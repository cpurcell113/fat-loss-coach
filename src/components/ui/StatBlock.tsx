import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

export function StatBlock({
  label,
  value,
  delta,
  deltaGoodDirection = 'down',
  unit = '',
}: {
  label: string;
  value: string | number;
  delta?: number | null;
  deltaGoodDirection?: 'up' | 'down';
  unit?: string;
}) {
  const isGood = delta != null
    ? (deltaGoodDirection === 'down' ? delta < 0 : delta > 0)
    : null;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-muted uppercase tracking-wide">{label}</span>
      <span className="text-xl font-bold tabular-nums">
        {value}
        {unit && <span className="text-sm text-muted ml-0.5">{unit}</span>}
      </span>
      {delta != null && (
        <div className={`flex items-center gap-0.5 text-xs ${isGood ? 'text-success' : isGood === false ? 'text-danger' : 'text-muted'}`}>
          {delta < 0 ? <TrendingDown size={12} /> : delta > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
          <span className="tabular-nums">{delta > 0 ? '+' : ''}{delta.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}
