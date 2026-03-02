const actions = [
  { label: "How am I tracking?", message: "How am I tracking toward my 90-day goal? Give me an honest assessment." },
  { label: "Adapt training", message: "Adapt today's training based on how I'm feeling right now." },
  { label: "What should I eat?", message: "What should I eat right now to hit my protein target and stay in my window?" },
  { label: "I hit a PR", message: "I hit a PR tonight on the sprints." },
  { label: "I'm struggling", message: "I'm struggling today. I need to talk through something." },
  { label: "Pull me back", message: "Pull me back to my covenant. I need to hear it right now." },
];

export function QuickActions({ onSelect, disabled }: { onSelect: (msg: string) => void; disabled: boolean }) {
  return (
    <div className="flex gap-2 px-3 py-2 overflow-x-auto">
      {actions.map(a => (
        <button
          key={a.label}
          onClick={() => !disabled && onSelect(a.message)}
          disabled={disabled}
          className="shrink-0 px-3 py-1.5 rounded-full bg-surface-alt text-xs text-muted border border-gold/15 active:bg-gold/10 disabled:opacity-40 transition-colors"
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
