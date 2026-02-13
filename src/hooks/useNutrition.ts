import { useStorage } from '../data/useStorage';
import type { NutritionEntry } from '../types';
import { getEntriesForDate } from '../utils/calculations';
import { today } from '../utils/date-helpers';

export function useNutrition() {
  const { data, add, update, remove } = useStorage<NutritionEntry>('nutrition');

  const todayEntry = getEntriesForDate(data, today())[0] || null;
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  return { entries: sorted, todayEntry, add, update, remove };
}
