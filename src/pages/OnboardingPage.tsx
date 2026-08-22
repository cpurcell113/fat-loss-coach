import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, setSettings, getCollection, setCollection } from '../data/storage';
import type { AppSettings, BodyCompEntry } from '../types';
import {
  BASELINE,
  HISTORICAL_PEAK,
  PROGRAM_START,
  PROGRAM_END,
  TARGETS,
  PROTEIN_TARGET,
} from '../constants/baseline';
import { CALORIE_RANGE, MACRO_TARGETS } from '../constants/macros';
import { today } from '../utils/date-helpers';

function Field({
  label,
  value,
  onChange,
  unit,
  step = 'any',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  step?: string;
}) {
  return (
    <div>
      <label className="text-[10px] text-muted uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2 mt-0.5">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm font-number outline-none"
          style={{ background: '#2a2a2a', color: '#f0ece4' }}
        />
        <span className="text-xs text-muted shrink-0 w-8">{unit}</span>
      </div>
    </div>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const existing = getSettings<AppSettings>('settings');
  const existingScans = getCollection<BodyCompEntry>('body_comp');
  const existingBaseline = existingScans.find(e => e.id === 'baseline');
  const existingPeak = existingScans.find(e => e.id === 'peak-2025');

  const [step, setStep] = useState(0);
  const [micGranted, setMicGranted] = useState(false);

  // Editable start baseline — prefilled but fully changeable
  const [weight, setWeight] = useState(String(existingBaseline?.weight ?? BASELINE.weight));
  const [bodyFat, setBodyFat] = useState(String(existingBaseline?.bodyFatPercent ?? BASELINE.bodyFatPercent));
  const [muscle, setMuscle] = useState(String(existingBaseline?.muscleMass ?? BASELINE.muscleMass));
  const [ecw, setEcw] = useState(String(existingBaseline?.ecwRatio ?? BASELINE.ecwRatio));
  const [baselineDate, setBaselineDate] = useState(existingBaseline?.date ?? today());
  const [keepPeak, setKeepPeak] = useState(true);
  const [baselineError, setBaselineError] = useState('');

  const saveBaselineAndContinue = () => {
    const w = parseFloat(weight);
    const bf = parseFloat(bodyFat);
    const smm = parseFloat(muscle);
    const ratio = parseFloat(ecw);

    if (isNaN(w) || w <= 0) {
      setBaselineError('Enter a valid starting weight.');
      return;
    }
    if (isNaN(bf) || bf <= 0 || bf >= 60) {
      setBaselineError('Enter a valid body fat %.');
      return;
    }

    setBaselineError('');

    const baselineEntry: BodyCompEntry = {
      id: 'baseline',
      date: baselineDate || today(),
      weight: w,
      muscleMass: isNaN(smm) ? null : smm,
      bodyFatPercent: bf,
      ecwRatio: isNaN(ratio) ? null : ratio,
      notes: 'Start baseline',
      source: 'inbody',
      createdAt: existingBaseline?.createdAt || new Date().toISOString(),
    };

    let next = existingScans.filter(e => e.id !== 'baseline' && e.id !== 'peak-2025');
    next.push(baselineEntry);

    if (keepPeak) {
      next.push({
        id: 'peak-2025',
        date: existingPeak?.date ?? HISTORICAL_PEAK.date,
        weight: existingPeak?.weight ?? HISTORICAL_PEAK.weight,
        muscleMass: existingPeak?.muscleMass ?? HISTORICAL_PEAK.muscleMass,
        bodyFatPercent: existingPeak?.bodyFatPercent ?? HISTORICAL_PEAK.bodyFatPercent,
        ecwRatio: existingPeak?.ecwRatio ?? HISTORICAL_PEAK.ecwRatio,
        notes: existingPeak?.notes || HISTORICAL_PEAK.label,
        source: 'inbody',
        createdAt: existingPeak?.createdAt || new Date(HISTORICAL_PEAK.date + 'T12:00:00').toISOString(),
      });
    }

    next = next.sort((a, b) => a.date.localeCompare(b.date));
    setCollection('body_comp', next);

    // Stash start weight for settings completion
    sessionStorage.setItem('onboarding_start_weight', String(w));
    setStep(2);
  };

  const handleComplete = () => {
    const startWeight = Number(sessionStorage.getItem('onboarding_start_weight')) || parseFloat(weight) || BASELINE.weight;
    const settings: AppSettings = {
      apiKey: existing?.apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY || '',
      startDate: PROGRAM_START,
      endDate: PROGRAM_END,
      startWeight,
      targetWeight: TARGETS.weight,
      targetBfPercent: TARGETS.bodyFatPercent,
      targetMuscleMassMin: TARGETS.muscleMassMin,
      targetMuscleMassMax: TARGETS.muscleMassMax,
      macroTargets: MACRO_TARGETS,
      onboardingComplete: true,
    };
    setSettings('settings', settings);
    sessionStorage.removeItem('onboarding_start_weight');
    navigate('/');
  };

  const requestMic = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicGranted(true);
      setTimeout(() => setStep(s => s + 1), 600);
    } catch {
      setMicGranted(false);
      setStep(s => s + 1);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0d0d0d' }}>

      {/* Step 0: Covenant */}
      {step === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center pb-safe">
          <div className="w-12 h-px mb-10" style={{ background: 'rgba(201,150,58,0.4)' }} />
          <div
            className="font-display font-bold leading-tight mb-10"
            style={{ fontSize: '28px', color: '#f0ece4' }}
          >
            My family won't need<br/>
            <span style={{ color: '#c9963a' }}>to heal from the work</span><br/>
            I didn't do.
          </div>
          <div className="w-12 h-px mb-10" style={{ background: 'rgba(201,150,58,0.4)' }} />
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full py-4 rounded-xl font-display font-bold text-xl tracking-wider text-black active:scale-95 transition-transform"
            style={{ background: '#c9963a' }}
          >
            ALL IN →
          </button>
        </div>
      )}

      {/* Step 1: Enter / edit baseline */}
      {step === 1 && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pt-8 pb-4">
            <h2 className="font-display font-bold text-3xl mb-1" style={{ color: '#c9963a' }}>
              SET YOUR BASELINE
            </h2>
            <p className="text-sm text-muted mb-5">
              Enter your starting InBody numbers. Pre-filled values are a starting point — change anything that isn’t yours.
            </p>

            <div
              className="rounded-xl p-4 mb-4 space-y-3"
              style={{ background: '#1a1a1a', border: '1px solid rgba(201,150,58,0.25)' }}
            >
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#c9963a' }}>
                90-Day Start Scan
              </p>
              <div>
                <label className="text-[10px] text-muted uppercase tracking-wider">Scan date</label>
                <input
                  type="date"
                  value={baselineDate}
                  onChange={e => setBaselineDate(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mt-0.5"
                  style={{ background: '#2a2a2a', color: '#f0ece4' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Weight" value={weight} onChange={setWeight} unit="lbs" step="0.1" />
                <Field label="Body Fat" value={bodyFat} onChange={setBodyFat} unit="%" step="0.1" />
                <Field label="SMM" value={muscle} onChange={setMuscle} unit="lbs" step="0.1" />
                <Field label="ECW/TBW" value={ecw} onChange={setEcw} unit="" step="0.001" />
              </div>
              {baselineError && (
                <p className="text-xs" style={{ color: '#8b3a3a' }}>{baselineError}</p>
              )}
            </div>

            <div
              className="rounded-xl p-4 mb-4"
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
            >
              <p className="text-xs text-muted mb-1">90-Day Goal — May 12, 2026</p>
              <p className="font-number font-bold text-lg" style={{ color: '#f0ece4' }}>
                {TARGETS.weight} lbs · {TARGETS.bodyFatPercent}% BF
              </p>
              <p className="text-xs text-muted">Hold all muscle · ECW/TBW ≤{TARGETS.ecwRatio}</p>
            </div>

            <label
              className="flex items-start gap-3 rounded-xl p-4 cursor-pointer"
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
            >
              <input
                type="checkbox"
                checked={keepPeak}
                onChange={e => setKeepPeak(e.target.checked)}
                className="mt-1 accent-gold"
              />
              <div>
                <p className="text-sm font-medium" style={{ color: '#f0ece4' }}>
                  Keep Aug 2025 peak as reference
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {HISTORICAL_PEAK.weight} lbs · {HISTORICAL_PEAK.bodyFatPercent}% BF · SMM {HISTORICAL_PEAK.muscleMass}
                </p>
              </div>
            </label>
          </div>

          <div
            className="shrink-0 flex gap-3 px-6 pt-3 pb-safe"
            style={{ borderTop: '1px solid #2a2a2a', background: '#0d0d0d', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
          >
            <button
              type="button"
              onClick={() => setStep(0)}
              className="flex-1 py-3.5 rounded-xl text-muted font-medium"
              style={{ background: '#1a1a1a' }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={saveBaselineAndContinue}
              className="flex-1 py-3.5 rounded-xl font-display font-bold text-base tracking-wide text-black"
              style={{ background: '#c9963a' }}
            >
              SAVE BASELINE
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Protocol */}
      {step === 2 && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pt-8 pb-4">
            <h2 className="font-display font-bold text-3xl mb-1" style={{ color: '#c9963a' }}>YOUR PROTOCOL</h2>
            <p className="text-sm text-muted mb-5">What produced your August 2025 results. Rebuild it exactly.</p>

            <div className="space-y-3 text-sm">
              {[
                { label: 'Fasting Window', value: '7:00am – 3:30pm' },
                { label: 'Eating Window', value: '3:30pm – 9:30pm' },
                { label: 'Protein Target', value: `${PROTEIN_TARGET}g daily (non-negotiable)` },
                { label: 'Training Days', value: `${CALORIE_RANGE.min}–${CALORIE_RANGE.max} cal` },
                { label: 'Echo Sprints', value: '20 rounds · 15s ON / 45s OFF · 5 nights/week' },
                { label: 'Strength', value: '3×/week · compound · hypertrophy' },
                { label: 'Evening Anchor', value: 'Icelandic skyr + 2 scoops Levels (~65g protein)' },
                { label: 'Sleep Target', value: '10:30pm lights out' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-start py-2.5 border-b" style={{ borderColor: '#2a2a2a' }}>
                  <span className="text-muted">{item.label}</span>
                  <span className="font-medium text-right ml-4" style={{ color: '#f0ece4' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="shrink-0 flex gap-3 px-6 pt-3"
            style={{ borderTop: '1px solid #2a2a2a', background: '#0d0d0d', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
          >
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3.5 rounded-xl text-muted font-medium"
              style={{ background: '#1a1a1a' }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 py-3.5 rounded-xl font-display font-bold text-base tracking-wide text-black"
              style={{ background: '#c9963a' }}
            >
              THIS IS IT
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Microphone */}
      {step === 3 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pb-safe">
          <div className="text-5xl mb-4">🎙️</div>
          <h2 className="font-display font-bold text-3xl mb-2" style={{ color: '#c9963a' }}>VOICE COACH</h2>
          <p className="text-sm text-muted mb-8">
            Hold the mic button to talk to your coach hands-free. He'll speak back.
            Works best after a sprint session when your hands are full.
          </p>
          <button
            type="button"
            onClick={requestMic}
            className="w-full py-4 rounded-xl font-display font-bold text-lg tracking-wide text-black mb-3 active:scale-95 transition-transform"
            style={{ background: '#c9963a' }}
          >
            ALLOW MICROPHONE
          </button>
          <button
            type="button"
            onClick={() => setStep(4)}
            className="px-4 py-3 text-sm text-muted rounded-lg"
            style={{ background: '#1a1a1a' }}
          >
            Skip — text only
          </button>
          {micGranted && <p className="text-xs mt-3" style={{ color: '#4a7c59' }}>✓ Microphone access granted</p>}
        </div>
      )}

      {/* Step 4: Install */}
      {step === 4 && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pt-8 pb-4 text-center">
            <div className="text-5xl mb-4">📱</div>
            <h2 className="font-display font-bold text-3xl mb-2" style={{ color: '#c9963a' }}>ADD TO HOME SCREEN</h2>
            <p className="text-sm text-muted mb-6">
              Install All In on your iPhone so it opens like a native app — no browser bar, works offline.
            </p>
            <div className="rounded-xl p-4 text-left mb-4 w-full" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
              <p className="text-sm font-medium mb-3" style={{ color: '#f0ece4' }}>iPhone Instructions:</p>
              <ol className="text-sm text-muted space-y-2">
                <li>1. Tap the <strong style={{ color: '#f0ece4' }}>Share</strong> button (box with arrow) in Safari</li>
                <li>2. Scroll down and tap <strong style={{ color: '#f0ece4' }}>Add to Home Screen</strong></li>
                <li>3. Tap <strong style={{ color: '#c9963a' }}>Add</strong></li>
              </ol>
            </div>
          </div>
          <div
            className="shrink-0 px-6 pt-3"
            style={{ borderTop: '1px solid #2a2a2a', background: '#0d0d0d', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
          >
            <button
              type="button"
              onClick={handleComplete}
              className="w-full py-4 rounded-xl font-display font-bold text-xl tracking-wider text-black active:scale-95 transition-transform"
              style={{ background: '#c9963a' }}
            >
              LET'S GO →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
