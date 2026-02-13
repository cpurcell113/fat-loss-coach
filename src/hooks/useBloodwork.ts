import { useStorage } from '../data/useStorage';
import type { LabResult } from '../types';

export function useBloodwork() {
  const { data, add, update, remove } = useStorage<LabResult>('bloodwork');

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  return { results: sorted, add, update, remove };
}
