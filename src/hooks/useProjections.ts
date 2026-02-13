import type { BodyCompEntry } from '../types';
import { weeklyRateOfChange, projectEndWeight, projectEndBfPercent } from '../utils/calculations';
import { getWeeksRemaining } from '../utils/date-helpers';
import { getLatestEntry } from '../utils/calculations';

export function useProjections(entries: BodyCompEntry[]) {
  const latest = getLatestEntry(entries);
  const rate = weeklyRateOfChange(entries);
  const weeksLeft = getWeeksRemaining();

  if (!latest || rate === null) {
    return { projectedWeight: null, projectedBf: null, rate: null, onTrack: null, pace: null };
  }

  const projectedWeight = projectEndWeight(latest.weight, rate, weeksLeft);
  const projectedBf = latest.bodyFatPercent
    ? projectEndBfPercent(latest.weight, latest.bodyFatPercent, projectedWeight)
    : null;

  let pace: 'ahead' | 'on-track' | 'behind';
  if (projectedWeight <= 218) pace = 'ahead';
  else if (projectedWeight <= 222) pace = 'on-track';
  else pace = 'behind';

  return { projectedWeight, projectedBf, rate, onTrack: pace === 'on-track' || pace === 'ahead', pace };
}
