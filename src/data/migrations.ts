import { PROGRAM_START, PROGRAM_END, BASELINE } from '../constants/baseline';
import { MACRO_TARGETS } from '../constants/macros';
import type { AppSettings, BodyCompEntry } from '../types';
import { getSettings, setSettings, getCollection, setCollection } from './storage';

const CURRENT_VERSION = 1;

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  startDate: PROGRAM_START,
  endDate: PROGRAM_END,
  startWeight: BASELINE.weight,
  targetWeight: 220,
  targetBfPercent: 12.5,
  targetMuscleMassMin: 110,
  targetMuscleMassMax: 113,
  macroTargets: MACRO_TARGETS,
  onboardingComplete: false,
};

export function runMigrations(): void {
  const stored = Number(localStorage.getItem('fla_schema_version') || '0');

  if (stored < 1) {
    if (!getSettings<AppSettings>('settings')) {
      setSettings('settings', DEFAULT_SETTINGS);
    }
    // Seed baseline body comp entry
    const existing = getCollection<BodyCompEntry>('body_comp');
    if (existing.length === 0) {
      const baseline: BodyCompEntry = {
        id: 'baseline',
        date: BASELINE.date,
        weight: BASELINE.weight,
        muscleMass: BASELINE.muscleMass,
        bodyFatPercent: BASELINE.bodyFatPercent,
        ecwRatio: BASELINE.ecwRatio,
        notes: 'Baseline InBody scan',
        source: 'inbody',
        createdAt: new Date().toISOString(),
      };
      setCollection('body_comp', [baseline]);
    }
  }

  localStorage.setItem('fla_schema_version', String(CURRENT_VERSION));
}
