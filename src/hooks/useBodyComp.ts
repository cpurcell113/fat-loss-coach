import { useStorage } from '../data/useStorage';
import type { BodyCompEntry } from '../types';
import { getLatestEntry, weeklyRateOfChange } from '../utils/calculations';

export function useBodyComp() {
  const { data, add, update, remove } = useStorage<BodyCompEntry>('body_comp');

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const latest = getLatestEntry(data);
  const rate = weeklyRateOfChange(data);

  return { entries: sorted, latest, rate, add, update, remove };
}
