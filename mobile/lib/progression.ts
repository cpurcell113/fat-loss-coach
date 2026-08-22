/**
 * Bounded auto-progression helpers for Track A.
 * Warm-up sets inform working capacity; prior top set + RPE drives next load.
 */

export interface SetLog {
  weight: number;
  reps: number;
  rpe: number;
  isWarmup?: boolean;
}

export interface ProgressionBounds {
  floor: number | null;
  ceiling: number | null;
  increment?: number;
}

export function estimateWorkingWeightFromWarmups(warmups: SetLog[]): number | null {
  if (warmups.length === 0) return null;
  const working = warmups.filter((s) => !s.isWarmup);
  const sets = working.length > 0 ? working : warmups;
  const best = sets.reduce((acc, s) => {
    const est1rm = s.weight * (1 + s.reps / 30);
    return Math.max(acc, est1rm);
  }, 0);
  return Math.round((best * 0.85) / 2.5) * 2.5;
}

export function suggestNextSet(
  previous: SetLog | null,
  targetReps: number,
  bounds: ProgressionBounds,
  readinessMultiplier = 1,
): { weight: number; reps: number } {
  const increment = bounds.increment ?? 5;
  let weight = previous?.weight ?? bounds.floor ?? 45;
  let reps = targetReps;

  if (previous) {
    if (previous.rpe <= 7 && previous.reps >= targetReps) {
      weight = previous.weight + increment;
    } else if (previous.rpe >= 9.5 || previous.reps < targetReps - 2) {
      weight = Math.max(previous.weight - increment, bounds.floor ?? 0);
    } else {
      weight = previous.weight;
      reps = Math.max(previous.reps, targetReps);
    }
  }

  weight = Math.round((weight * readinessMultiplier) / 2.5) * 2.5;
  if (bounds.floor != null) weight = Math.max(weight, bounds.floor);
  if (bounds.ceiling != null) weight = Math.min(weight, bounds.ceiling);

  return { weight, reps };
}

export function parseTargetReps(target: string): number {
  const match = target.match(/\d+/);
  return match ? parseInt(match[0], 10) : 8;
}
