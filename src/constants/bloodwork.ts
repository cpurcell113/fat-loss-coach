export const LAB_OPTIMAL_RANGES: Record<string, {
  unit: string;
  optMin: number;
  optMax: number;
  refMin: number;
  refMax: number;
}> = {
  'Testosterone, Total': { unit: 'ng/dL', optMin: 600, optMax: 1000, refMin: 264, refMax: 916 },
  'Free Testosterone': { unit: 'pg/mL', optMin: 15, optMax: 25, refMin: 8.7, refMax: 25.1 },
  'TSH': { unit: 'mIU/L', optMin: 0.5, optMax: 2.5, refMin: 0.45, refMax: 4.5 },
  'Free T3': { unit: 'pg/mL', optMin: 3.0, optMax: 4.0, refMin: 2.0, refMax: 4.4 },
  'Free T4': { unit: 'ng/dL', optMin: 1.0, optMax: 1.5, refMin: 0.82, refMax: 1.77 },
  'Cortisol, AM': { unit: 'ug/dL', optMin: 10, optMax: 18, refMin: 6.2, refMax: 19.4 },
  'Vitamin D, 25-OH': { unit: 'ng/mL', optMin: 50, optMax: 80, refMin: 30, refMax: 100 },
  'Ferritin': { unit: 'ng/mL', optMin: 50, optMax: 200, refMin: 30, refMax: 400 },
  'Magnesium, RBC': { unit: 'mg/dL', optMin: 5.0, optMax: 6.5, refMin: 4.2, refMax: 6.8 },
  'Iron, Serum': { unit: 'ug/dL', optMin: 60, optMax: 170, refMin: 38, refMax: 169 },
  'CRP, High Sens': { unit: 'mg/L', optMin: 0, optMax: 1.0, refMin: 0, refMax: 3.0 },
  'Hemoglobin A1c': { unit: '%', optMin: 4.5, optMax: 5.2, refMin: 4.0, refMax: 5.6 },
  'Fasting Glucose': { unit: 'mg/dL', optMin: 70, optMax: 90, refMin: 65, refMax: 99 },
  'Fasting Insulin': { unit: 'uIU/mL', optMin: 2, optMax: 8, refMin: 2.6, refMax: 24.9 },
};

export const LAB_MARKER_NAMES = Object.keys(LAB_OPTIMAL_RANGES);
