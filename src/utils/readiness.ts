/** Daily readiness from morning check-in metrics (0–100). */

export interface ReadinessInput {
  sleepHours: number;
  sleepQuality: number; // 1–5
  energyLevel: number; // 1–10
  stressLevel: number; // 1–10, lower is better
  soreness?: number; // 1–10, lower is better
}

export function calculateReadinessScore(input: ReadinessInput): number {
  const sleepDurationScore = Math.min(100, (input.sleepHours / 8) * 100);
  const sleepQualityScore = (input.sleepQuality / 5) * 100;
  const energyScore = (input.energyLevel / 10) * 100;

  const stressScore = ((10 - input.stressLevel) / 9) * 100;
  const soreness = input.soreness ?? 5;
  const sorenessScore = ((10 - soreness) / 9) * 100;
  const recoveryScore = (stressScore + sorenessScore) / 2;

  const composite =
    sleepDurationScore * 0.25 +
    sleepQualityScore * 0.2 +
    recoveryScore * 0.25 +
    energyScore * 0.3;

  return Math.round(Math.max(0, Math.min(100, composite)));
}

export function readinessLabel(score: number): string {
  if (score >= 85) return 'Prime';
  if (score >= 70) return 'Ready';
  if (score >= 55) return 'Steady';
  if (score >= 40) return 'Guard';
  return 'Recover';
}

export function readinessColor(score: number): string {
  if (score >= 85) return '#4a7c59';
  if (score >= 70) return '#c9963a';
  if (score >= 55) return '#c9963a';
  if (score >= 40) return '#a67c3a';
  return '#8b3a3a';
}
