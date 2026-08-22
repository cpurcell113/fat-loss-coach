export interface ReadinessInput {
  sleepHours: number;
  sleepQuality: number; // 1-5
  soreness: number; // 1-10 (lower is better)
  energy: number; // 1-10
  hrv?: number | null;
}

export function calculateReadinessScore(input: ReadinessInput): number {
  const sleepDurationScore = Math.min(100, (input.sleepHours / 8) * 100);
  const sleepQualityScore = (input.sleepQuality / 5) * 100;
  const sorenessScore = ((10 - input.soreness) / 9) * 100;
  const energyScore = (input.energy / 10) * 100;

  const composite =
    sleepDurationScore * 0.25 +
    sleepQualityScore * 0.2 +
    sorenessScore * 0.25 +
    energyScore * 0.3;

  return Math.round(Math.max(0, Math.min(100, composite)));
}

export function readinessMultiplier(score: number): number {
  if (score >= 85) return 1.03;
  if (score >= 70) return 1.0;
  if (score >= 55) return 0.97;
  if (score >= 40) return 0.94;
  return 0.9;
}
