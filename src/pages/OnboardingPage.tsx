import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, setSettings } from '../data/storage';
import type { AppSettings } from '../types';
import { BASELINE, PROGRAM_START, PROGRAM_END } from '../constants/baseline';
import { MACRO_TARGETS } from '../constants/macros';

export function OnboardingPage() {
  const navigate = useNavigate();
  const existing = getSettings<AppSettings>('settings');

  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState(existing?.apiKey || '');
  const [startWeight, setStartWeight] = useState(existing?.startWeight || BASELINE.weight);
  const [targetWeight, setTargetWeight] = useState(existing?.targetWeight || 220);

  const handleComplete = () => {
    const settings: AppSettings = {
      apiKey,
      startDate: PROGRAM_START,
      endDate: PROGRAM_END,
      startWeight,
      targetWeight,
      targetBfPercent: 12.5,
      targetMuscleMassMin: 110,
      targetMuscleMassMax: 113,
      macroTargets: MACRO_TARGETS,
      onboardingComplete: true,
    };
    setSettings('settings', settings);
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full px-6 py-8">
      {step === 0 && (
        <div className="flex-1 flex flex-col justify-center text-center">
          <div className="text-5xl mb-6">🏋️</div>
          <h1 className="text-2xl font-bold mb-3">Fat Loss Coach</h1>
          <p className="text-muted text-sm mb-2">Your AI-powered body recomposition coach</p>
          <p className="text-muted text-sm mb-8">12 weeks. 248.7 → 220 lbs. Let's go.</p>
          <button
            onClick={() => setStep(1)}
            className="w-full py-3 bg-primary rounded-xl font-semibold active:scale-95 transition-transform"
          >
            Set Up
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-xl font-bold mb-2">API Key</h2>
          <p className="text-sm text-muted mb-6">
            This app uses Claude as your coach brain. Enter your Anthropic API key. It stays on your device only.
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full bg-surface-alt rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 mb-3"
          />
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary mb-8"
          >
            Get an API key from console.anthropic.com →
          </a>
          <div className="mt-auto flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 py-3 bg-surface-alt rounded-xl font-medium">
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!apiKey.startsWith('sk-')}
              className="flex-1 py-3 bg-primary rounded-xl font-semibold disabled:opacity-40 active:scale-95 transition-transform"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-xl font-bold mb-2">Your Baseline</h2>
          <p className="text-sm text-muted mb-6">Confirm your starting and target numbers.</p>

          <div className="space-y-4 mb-8">
            <div>
              <label className="text-sm text-muted">Start Date</label>
              <p className="text-lg font-semibold">Feb 15, 2026</p>
            </div>
            <div>
              <label className="text-sm text-muted">Starting Weight</label>
              <input
                type="number"
                value={startWeight}
                onChange={e => setStartWeight(Number(e.target.value))}
                className="w-full bg-surface-alt rounded-lg px-4 py-2 mt-1 text-lg font-semibold outline-none focus:ring-2 focus:ring-primary/50"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="text-sm text-muted">Target Weight</label>
              <input
                type="number"
                value={targetWeight}
                onChange={e => setTargetWeight(Number(e.target.value))}
                className="w-full bg-surface-alt rounded-lg px-4 py-2 mt-1 text-lg font-semibold outline-none focus:ring-2 focus:ring-primary/50"
                inputMode="decimal"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted">Target BF%</span>
                <p className="font-semibold">12.5%</p>
              </div>
              <div>
                <span className="text-muted">Muscle Target</span>
                <p className="font-semibold">110-113 lbs</p>
              </div>
              <div>
                <span className="text-muted">Daily Protein</span>
                <p className="font-semibold">275-300g</p>
              </div>
              <div>
                <span className="text-muted">Timeline</span>
                <p className="font-semibold">12 weeks</p>
              </div>
            </div>
          </div>

          <div className="mt-auto flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 bg-surface-alt rounded-xl font-medium">
              Back
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 py-3 bg-primary rounded-xl font-semibold active:scale-95 transition-transform"
            >
              Let's Go
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
