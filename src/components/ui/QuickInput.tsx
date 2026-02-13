import { Minus, Plus } from 'lucide-react';

export function QuickInput({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  unit = '',
  hint = '',
}: {
  label: string;
  value: number | '';
  onChange: (val: number | '') => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  hint?: string;
}) {
  const numVal = typeof value === 'number' ? value : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-sm text-muted">{label}</label>
        {hint && <span className="text-[10px] text-muted">{hint}</span>}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, numVal - step))}
          className="w-10 h-10 rounded-lg bg-surface-alt flex items-center justify-center active:bg-white/10 transition-colors"
        >
          <Minus size={16} />
        </button>
        <div className="flex-1 relative">
          <input
            type="number"
            value={value}
            onChange={e => {
              const v = e.target.value;
              onChange(v === '' ? '' : Math.min(max, Math.max(min, Number(v))));
            }}
            className="w-full h-10 bg-surface-alt rounded-lg px-3 text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-primary/50"
            inputMode="decimal"
          />
          {unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{unit}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, numVal + step))}
          className="w-10 h-10 rounded-lg bg-surface-alt flex items-center justify-center active:bg-white/10 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
