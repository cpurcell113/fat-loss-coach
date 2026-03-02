export const PROGRAM_START = '2026-02-12';
export const PROGRAM_END = '2026-05-12';
export const TOTAL_WEEKS = 13;

export const BASELINE = {
  weight: 248.7,
  muscleMass: 114.4,
  bodyFatPercent: 20.5,
  ecwRatio: 0.368,
  date: '2026-02-12',
  label: 'Current — 90-day start',
} as const;

export const HISTORICAL_PEAK = {
  weight: 232.6,
  muscleMass: 109.8,
  bodyFatPercent: 18.5,
  ecwRatio: 0.366,
  date: '2025-08-05',
  label: 'Peak — Pre-grief baseline',
} as const;

export const TARGETS = {
  weight: 227,
  bodyFatPercent: 12.5,
  muscleMass: 114,
  muscleMassMin: 110,
  muscleMassMax: 114,
  ecwRatio: 0.358,
  ecwRatioWarning: 0.390,
  maxWeeklyLossLbs: 3,
  minWeeklyLossLbs: 1,
  muscleLossAlertLbs: 1,
} as const;

export const PROTEIN_TARGET = 285;
