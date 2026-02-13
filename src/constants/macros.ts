import type { MacroTargets } from '../types';

export const MACRO_TARGETS: MacroTargets = {
  protein: { min: 275, max: 300 },
  carbs: { min: 150, max: 180 },
  fats: { min: 55, max: 65 },
};

export const CALORIE_RANGE = {
  min: 275 * 4 + 150 * 4 + 55 * 9,  // 2195
  max: 300 * 4 + 180 * 4 + 65 * 9,  // 2505
} as const;
