export function RatingSelector({
  label,
  value,
  onChange,
  max = 5,
  lowLabel = '',
  highLabel = '',
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-muted">{label}</span>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: max }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-colors ${
              n <= value
                ? n <= 2 ? 'bg-danger/80 text-white' : n <= 3 ? 'bg-warning/80 text-white' : 'bg-success/80 text-white'
                : 'bg-surface-alt text-muted'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-[10px] text-muted px-1">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}
