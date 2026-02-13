export function MacroBar({
  label,
  value,
  min,
  max,
  color = 'bg-primary',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  color?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const inRange = value >= min && value <= max;
  const over = value > max;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className={`font-semibold tabular-nums ${inRange ? 'text-success' : over ? 'text-danger' : 'text-warning'}`}>
          {Math.round(value)}g
          <span className="text-muted font-normal ml-1">/ {min}-{max}g</span>
        </span>
      </div>
      <div className="h-2 bg-surface-alt rounded-full overflow-hidden relative">
        {/* Target range indicator */}
        <div
          className="absolute h-full bg-white/5"
          style={{ left: `${(min / (max * 1.3)) * 100}%`, width: `${((max - min) / (max * 1.3)) * 100}%` }}
        />
        <div
          className={`h-full rounded-full transition-all duration-300 ${inRange ? 'bg-success' : over ? 'bg-danger' : color}`}
          style={{ width: `${Math.min(pct, 130)}%` }}
        />
      </div>
    </div>
  );
}
