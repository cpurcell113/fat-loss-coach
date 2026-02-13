import type { ReactNode } from 'react';

export function PageHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-surface/80 backdrop-blur-sm sticky top-0 z-10 border-b border-white/5">
      <h1 className="text-lg font-semibold">{title}</h1>
      {right}
    </div>
  );
}
