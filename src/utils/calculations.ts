import type { BodyCompEntry, NutritionEntry, MacroTargets } from '../types';

export function autoCalories(protein: number, carbs: number, fats: number): number {
  return Math.round(protein * 4 + carbs * 4 + fats * 9);
}

export function weeklyRateOfChange(entries: BodyCompEntry[], weeks: number = 3): number | null {
  const sorted = [...entries]
    .filter(e => e.weight > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return null;

  const recent = sorted.slice(-Math.min(sorted.length, weeks * 2));
  const first = recent[0];
  const last = recent[recent.length - 1];
  const daysDiff = Math.max(1, (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24));
  const weeksDiff = daysDiff / 7;

  return weeksDiff > 0 ? (first.weight - last.weight) / weeksDiff : null;
}

export function projectEndWeight(currentWeight: number, ratePerWeek: number, weeksRemaining: number): number {
  return Math.round((currentWeight - ratePerWeek * weeksRemaining) * 10) / 10;
}

export function projectEndBfPercent(
  currentWeight: number,
  currentBfPercent: number,
  projectedEndWeight: number,
): number {
  const currentFatMass = currentWeight * (currentBfPercent / 100);
  const leanMass = currentWeight - currentFatMass;
  const projectedFatMass = projectedEndWeight - leanMass;
  return Math.round((projectedFatMass / projectedEndWeight) * 100 * 10) / 10;
}

export function macroCompliance(
  entry: NutritionEntry,
  targets: MacroTargets,
): { protein: string; carbs: string; fats: string; overall: boolean } {
  const check = (val: number, range: { min: number; max: number }) => {
    if (val < range.min) return 'under';
    if (val > range.max) return 'over';
    return 'in-range';
  };
  const protein = check(entry.protein, targets.protein);
  const carbs = check(entry.carbs, targets.carbs);
  const fats = check(entry.fats, targets.fats);
  return {
    protein,
    carbs,
    fats,
    overall: protein === 'in-range' && carbs === 'in-range' && fats === 'in-range',
  };
}

export function getLatestEntry<T extends { date: string }>(entries: T[]): T | null {
  if (entries.length === 0) return null;
  return [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function getEntriesForDate<T extends { date: string }>(entries: T[], date: string): T[] {
  return entries.filter(e => e.date === date);
}

export function averageField<T>(entries: T[], field: keyof T): number | null {
  const values: number[] = [];
  for (const e of entries) {
    const v = e[field];
    if (typeof v === 'number' && !isNaN(v)) values.push(v);
  }
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}
