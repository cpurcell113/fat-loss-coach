export type DateString = string; // "YYYY-MM-DD"

export interface BodyCompEntry {
  id: string;
  date: DateString;
  weight: number;
  muscleMass: number | null;
  bodyFatPercent: number | null;
  ecwRatio: number | null;
  notes: string;
  source: 'scale' | 'inbody' | 'dexa';
  createdAt: string;
}

export interface NutritionEntry {
  id: string;
  date: DateString;
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
  fiber: number | null;
  water: number | null;
  notes: string;
  createdAt: string;
}

export interface DailyCheckIn {
  id: string;
  date: DateString;
  sleepHours: number;
  sleepQuality: number;   // 1-5
  energyLevel: number;    // 1-10
  stressLevel: number;    // 1-10
  stressSource: string | null; // 'Work' | 'Financial' | 'Family' | 'Health' | 'All clear'
  fastingStatus: 'fasting' | 'window-open';
  oneWord: string;
  soreness: number;
  hunger: number;
  mood: number;
  digestion: number;
  didCardio: boolean;
  didResistance: boolean;
  claudeDirective: string | null;
  notes: string;
  createdAt: string;
}

export interface SprintSession {
  id: string;
  date: DateString;
  type: 'treadmill' | 'echo-bike' | 'assault-bike' | 'rower' | 'other';
  rounds: number;
  workSeconds: number;
  restSeconds: number;
  distance: number | null; // miles, for treadmill
  avgCalPerRound: number | null;
  peakCalPerRound: number | null;
  totalCalories: number | null;
  avgHeartRate: number | null;
  peakHeartRate: number | null;
  rpe: number;
  notes: string;
  createdAt: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  rpe: number | null;
  notes: string;
}

export interface StrengthSession {
  id: string;
  date: DateString;
  label: string; // 'A' | 'B' | 'C' or custom
  exercises: Exercise[];
  duration: number | null;
  notes: string;
  rpe: number;
  createdAt: string;
}

export interface TrainingEntry {
  id: string;
  date: DateString;
  type: 'resistance' | 'cardio-sprint' | 'cardio-steady' | 'mobility';
  duration: number;
  muscleGroups: string[];
  rpe: number;
  notes: string;
  createdAt: string;
}

export interface LabMarker {
  name: string;
  value: number;
  unit: string;
  referenceMin: number | null;
  referenceMax: number | null;
  optimalMin: number | null;
  optimalMax: number | null;
}

export interface LabResult {
  id: string;
  date: DateString;
  markers: LabMarker[];
  labName: string;
  notes: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface MacroTargets {
  protein: { min: number; max: number };
  carbs: { min: number; max: number };
  fats: { min: number; max: number };
}

export interface AppSettings {
  apiKey: string;
  startDate: DateString;
  endDate: DateString;
  startWeight: number;
  targetWeight: number;
  targetBfPercent: number;
  targetMuscleMassMin: number;
  targetMuscleMassMax: number;
  macroTargets: MacroTargets;
  onboardingComplete: boolean;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  message: string;
  recommendation: string;
}
