import { useStorage } from '../data/useStorage';
import type { StrengthSession } from '../types';

export function useStrengthSessions() {
  const { data, add, remove } = useStorage<StrengthSession>('strength_sessions');
  const sessions = [...data].sort((a, b) => b.date.localeCompare(a.date));
  return { sessions, add, remove };
}
