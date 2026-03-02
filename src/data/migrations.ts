import { PROGRAM_START, PROGRAM_END, BASELINE, HISTORICAL_PEAK, TARGETS } from '../constants/baseline';
import { MACRO_TARGETS } from '../constants/macros';
import type { AppSettings, BodyCompEntry } from '../types';
import { getSettings, setSettings, getCollection, setCollection } from './storage';

const CURRENT_VERSION = 2;

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  startDate: PROGRAM_START,
  endDate: PROGRAM_END,
  startWeight: BASELINE.weight,
  targetWeight: TARGETS.weight,
  targetBfPercent: TARGETS.bodyFatPercent,
  targetMuscleMassMin: TARGETS.muscleMassMin,
  targetMuscleMassMax: TARGETS.muscleMassMax,
  macroTargets: MACRO_TARGETS,
  onboardingComplete: false,
};

export function runMigrations(): void {
  const stored = Number(localStorage.getItem('fla_schema_version') || '0');

  if (stored < 1) {
    if (!getSettings<AppSettings>('settings')) {
      setSettings('settings', DEFAULT_SETTINGS);
    }
  }

  if (stored < 2) {
    // Seed both InBody scans: Aug 2025 peak + Feb 2026 baseline
    const existing = getCollection<BodyCompEntry>('body_comp');
    const hasPeak = existing.some(e => e.id === 'peak-2025');
    const hasBaseline = existing.some(e => e.id === 'baseline');
    const toAdd: BodyCompEntry[] = [];

    if (!hasPeak) {
      toAdd.push({
        id: 'peak-2025',
        date: HISTORICAL_PEAK.date,
        weight: HISTORICAL_PEAK.weight,
        muscleMass: HISTORICAL_PEAK.muscleMass,
        bodyFatPercent: HISTORICAL_PEAK.bodyFatPercent,
        ecwRatio: HISTORICAL_PEAK.ecwRatio,
        notes: HISTORICAL_PEAK.label,
        source: 'inbody',
        createdAt: new Date(HISTORICAL_PEAK.date + 'T12:00:00').toISOString(),
      });
    }

    if (!hasBaseline) {
      toAdd.push({
        id: 'baseline',
        date: BASELINE.date,
        weight: BASELINE.weight,
        muscleMass: BASELINE.muscleMass,
        bodyFatPercent: BASELINE.bodyFatPercent,
        ecwRatio: BASELINE.ecwRatio,
        notes: BASELINE.label,
        source: 'inbody',
        createdAt: new Date(BASELINE.date + 'T12:00:00').toISOString(),
      });
    }

    if (toAdd.length > 0) {
      const sorted = [...existing, ...toAdd].sort((a, b) => a.date.localeCompare(b.date));
      setCollection('body_comp', sorted);
    }

    // Ensure settings exist
    if (!getSettings<AppSettings>('settings')) {
      setSettings('settings', DEFAULT_SETTINGS);
    }
  }

  localStorage.setItem('fla_schema_version', String(CURRENT_VERSION));
}
