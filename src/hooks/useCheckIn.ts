import { useStorage } from '../data/useStorage';
import type { DailyCheckIn } from '../types';
import { getEntriesForDate } from '../utils/calculations';
import { today } from '../utils/date-helpers';

export function useCheckIn() {
  const { data, add, update, remove } = useStorage<DailyCheckIn>('check_ins');

  const todayEntry = getEntriesForDate(data, today())[0] || null;
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  return { entries: sorted, todayEntry, add, update, remove };
}
