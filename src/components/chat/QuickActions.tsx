const actions = [
  { label: "Today's plan", message: "What's my plan for today? Give me meals, macros, and training." },
  { label: 'Going out', message: "I'm going out to eat. Help me plan what to order." },
  { label: 'How am I doing?', message: 'Give me a progress update. Am I on track for my goals?' },
  { label: 'Adjust macros', message: 'Should I adjust my macros based on my recent progress?' },
];

export function QuickActions({ onSelect, disabled }: { onSelect: (msg: string) => void; disabled: boolean }) {
  return (
    <div className="flex gap-2 px-3 py-2 overflow-x-auto">
      {actions.map(a => (
        <button
          key={a.label}
          onClick={() => !disabled && onSelect(a.message)}
          disabled={disabled}
          className="shrink-0 px-3 py-1.5 rounded-full bg-surface-alt text-xs text-muted ring-1 ring-white/10 active:bg-white/10 disabled:opacity-40 transition-colors"
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
