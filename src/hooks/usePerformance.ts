import { useStorage } from '../data/useStorage';
import type { SprintSession } from '../types';

export function usePerformance() {
  const { data, add, update, remove } = useStorage<SprintSession>('sprint_sessions');

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  return { sessions: sorted, add, update, remove };
}
