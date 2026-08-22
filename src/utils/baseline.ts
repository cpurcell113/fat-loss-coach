import { BASELINE, HISTORICAL_PEAK } from '../constants/baseline';
import type { BodyCompEntry } from '../types';

export type ActiveBaseline = {
  weight: number;
  muscleMass: number;
  bodyFatPercent: number;
  ecwRatio: number;
  date: string;
  label: string;
};

/** Prefer the stored Start scan; fall back to seeded constants. */
export function resolveBaseline(entries: BodyCompEntry[]): ActiveBaseline {
  const stored = entries.find(e => e.id === 'baseline');
  if (stored) {
    return {
      weight: stored.weight,
      muscleMass: stored.muscleMass ?? BASELINE.muscleMass,
      bodyFatPercent: stored.bodyFatPercent ?? BASELINE.bodyFatPercent,
      ecwRatio: stored.ecwRatio ?? BASELINE.ecwRatio,
      date: stored.date,
      label: stored.notes || BASELINE.label,
    };
  }
  return { ...BASELINE };
}

export function resolvePeak(entries: BodyCompEntry[]): ActiveBaseline {
  const stored = entries.find(e => e.id === 'peak-2025');
  if (stored) {
    return {
      weight: stored.weight,
      muscleMass: stored.muscleMass ?? HISTORICAL_PEAK.muscleMass,
      bodyFatPercent: stored.bodyFatPercent ?? HISTORICAL_PEAK.bodyFatPercent,
      ecwRatio: stored.ecwRatio ?? HISTORICAL_PEAK.ecwRatio,
      date: stored.date,
      label: stored.notes || HISTORICAL_PEAK.label,
    };
  }
  return { ...HISTORICAL_PEAK };
}
