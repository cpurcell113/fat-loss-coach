export const PROGRAM_START = '2026-02-15';
export const PROGRAM_END = '2026-05-09';
export const TOTAL_WEEKS = 12;

export const BASELINE = {
  weight: 248.7,
  muscleMass: 114.4,
  bodyFatPercent: 20.5,
  ecwRatio: 0.368,
  date: '2026-02-15',
} as const;

export const TARGETS = {
  weight: 220,
  bodyFatPercent: 12.5,
  muscleMassMin: 110,
  muscleMassMax: 113,
  ecwRatioWarning: 0.390,
  maxWeeklyLossLbs: 3,
  minWeeklyLossLbs: 1,
  muscleLossAlertLbs: 1,
} as const;
