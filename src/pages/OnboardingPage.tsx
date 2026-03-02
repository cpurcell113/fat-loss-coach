import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Anthropic from '@anthropic-ai/sdk';
import { getSettings, setSettings } from '../data/storage';
import type { AppSettings } from '../types';
import { BASELINE, PROGRAM_START, PROGRAM_END, TARGETS, PROTEIN_TARGET } from '../constants/baseline';
import { CALORIE_RANGE, MACRO_TARGETS } from '../constants/macros';

export function OnboardingPage() {
  const navigate = useNavigate();
  const existing = getSettings<AppSettings>('settings');

  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState(existing?.apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY || '');
  const [micGranted, setMicGranted] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [keyValidating, setKeyValidating] = useState(false);

  const validateKey = async () => {
    if (!apiKey.trim()) { setKeyError('Paste your API key above.'); return; }
    setKeyValidating(true);
    setKeyError('');
    try {
      const client = new Anthropic({ apiKey: apiKey.trim(), dangerouslyAllowBrowser: true });
      await client.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] });
      setStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid key';
      if (msg.includes('401') || msg.includes('auth')) setKeyError('Invalid API key — double-check and try again.');
      else if (msg.includes('402') || msg.includes('credit')) setKeyError('No credits on this key. Add credits at console.anthropic.com.');
      else setKeyError(`Error: ${msg}`);
    } finally {
      setKeyValidating(false);
    }
  };

  const handleComplete = () => {
    const settings: AppSettings = {
      apiKey,
      startDate: PROGRAM_START,
      endDate: PROGRAM_END,
      startWeight: BASELINE.weight,
      targetWeight: TARGETS.weight,
      targetBfPercent: TARGETS.bodyFatPercent,
      targetMuscleMassMin: TARGETS.muscleMassMin,
      targetMuscleMassMax: TARGETS.muscleMassMax,
      macroTargets: MACRO_TARGETS,
      onboardingComplete: true,
    };
    setSettings('settings', settings);
    navigate('/');
  };

  const requestMic = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicGranted(true);
    } catch {
      setMicGranted(false);
    }
    setStep(s => s + 1);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0d0d' }}>

      {/* Step 0: Covenant */}
      {step === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
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
            onClick={() => setStep(1)}
            className="w-full py-4 rounded-xl font-display font-bold text-xl tracking-wider text-black active:scale-95 transition-transform"
            style={{ background: '#c9963a' }}
          >
            ALL IN →
          </button>
        </div>
      )}

      {/* Step 1: API Key */}
      {step === 1 && (
        <div className="flex-1 flex flex-col px-6 py-10">
          <h2 className="font-display font-bold text-3xl mb-1" style={{ color: '#c9963a' }}>CLAUDE API KEY</h2>
          <p className="text-sm text-muted mb-6">
            Your AI coach runs on Claude. Get your key at console.anthropic.com — $5 in credits lasts months for personal use.
          </p>

          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full rounded-xl px-4 py-3.5 text-sm outline-none mb-3"
            style={{ background: '#1a1a1a', color: '#f0ece4', border: '1px solid rgba(201,150,58,0.2)' }}
            autoComplete="off"
          />
          <p className="text-xs text-muted mb-3">
            Stored locally on your device. Never sent anywhere except directly to Anthropic.
          </p>
          {keyError && (
            <p className="text-xs mb-auto" style={{ color: '#8b3a3a' }}>{keyError}</p>
          )}

          <div className="flex gap-3 mt-8">
            <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl text-muted font-medium" style={{ background: '#1a1a1a' }}>
              Back
            </button>
            <button
              onClick={validateKey}
              disabled={keyValidating}
              className="flex-1 py-3 rounded-xl font-display font-bold text-base tracking-wide text-black disabled:opacity-60"
              style={{ background: '#c9963a' }}
            >
              {keyValidating ? 'CHECKING...' : 'NEXT'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Baseline loaded */}
      {step === 2 && (
        <div className="flex-1 flex flex-col px-6 py-10">
          <h2 className="font-display font-bold text-3xl mb-1" style={{ color: '#c9963a' }}>BASELINE LOADED</h2>
          <p className="text-sm text-muted mb-6">Your InBody scan history is pre-loaded. This is where you are and where you've been.</p>

          <div className="space-y-3 mb-auto">
            <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid rgba(201,150,58,0.2)' }}>
              <p className="text-xs text-muted mb-1">Feb 12, 2026 — 90-Day Start</p>
              <p className="font-number font-bold text-lg" style={{ color: '#f0ece4' }}>
                {BASELINE.weight} lbs · {BASELINE.bodyFatPercent}% BF
              </p>
              <p className="text-xs text-muted">SMM {BASELINE.muscleMass} lbs · ECW/TBW {BASELINE.ecwRatio}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
              <p className="text-xs text-muted mb-1">Aug 5, 2025 — Peak (Pre-grief baseline)</p>
              <p className="font-number font-bold text-lg" style={{ color: '#f0ece4' }}>
                232.6 lbs · 18.5% BF
              </p>
              <p className="text-xs text-muted">SMM 109.8 lbs · ECW/TBW 0.366</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid rgba(74,124,89,0.3)' }}>
              <p className="text-xs mb-1" style={{ color: '#4a7c59' }}>90-Day Goal — May 12, 2026</p>
              <p className="font-number font-bold text-lg" style={{ color: '#f0ece4' }}>
                {TARGETS.weight} lbs · {TARGETS.bodyFatPercent}% BF
              </p>
              <p className="text-xs text-muted">Hold all muscle · ECW/TBW ≤{TARGETS.ecwRatio}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-muted font-medium" style={{ background: '#1a1a1a' }}>
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3 rounded-xl font-display font-bold text-base tracking-wide text-black"
              style={{ background: '#c9963a' }}
            >
              CONFIRMED
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Protocol */}
      {step === 3 && (
        <div className="flex-1 flex flex-col px-6 py-10 overflow-y-auto">
          <h2 className="font-display font-bold text-3xl mb-1" style={{ color: '#c9963a' }}>YOUR PROTOCOL</h2>
          <p className="text-sm text-muted mb-5">What produced your August 2025 results. Rebuild it exactly.</p>

          <div className="space-y-3 mb-auto text-sm">
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

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl text-muted font-medium" style={{ background: '#1a1a1a' }}>
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 py-3 rounded-xl font-display font-bold text-base tracking-wide text-black"
              style={{ background: '#c9963a' }}
            >
              THIS IS IT
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Microphone */}
      {step === 4 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-5xl mb-4">🎙️</div>
          <h2 className="font-display font-bold text-3xl mb-2" style={{ color: '#c9963a' }}>VOICE COACH</h2>
          <p className="text-sm text-muted mb-8">
            Hold the mic button to talk to your coach hands-free. He'll speak back.
            Works best after a sprint session when your hands are full.
          </p>
          <button
            onClick={requestMic}
            className="w-full py-4 rounded-xl font-display font-bold text-lg tracking-wide text-black mb-3 active:scale-95 transition-transform"
            style={{ background: '#c9963a' }}
          >
            ALLOW MICROPHONE
          </button>
          <button
            onClick={() => setStep(5)}
            className="text-sm text-muted"
          >
            Skip — text only
          </button>
          {micGranted && <p className="text-xs mt-3" style={{ color: '#4a7c59' }}>✓ Microphone access granted</p>}
        </div>
      )}

      {/* Step 5: Install */}
      {step === 5 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-5xl mb-4">📱</div>
          <h2 className="font-display font-bold text-3xl mb-2" style={{ color: '#c9963a' }}>ADD TO HOME SCREEN</h2>
          <p className="text-sm text-muted mb-6">
            Install All In on your iPhone so it opens like a native app — no browser bar, works offline.
          </p>
          <div className="rounded-xl p-4 text-left mb-8 w-full" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <p className="text-sm font-medium mb-3" style={{ color: '#f0ece4' }}>iPhone Instructions:</p>
            <ol className="text-sm text-muted space-y-2">
              <li>1. Tap the <strong style={{ color: '#f0ece4' }}>Share</strong> button (box with arrow) in Safari</li>
              <li>2. Scroll down and tap <strong style={{ color: '#f0ece4' }}>Add to Home Screen</strong></li>
              <li>3. Tap <strong style={{ color: '#c9963a' }}>Add</strong></li>
            </ol>
          </div>
          <button
            onClick={handleComplete}
            className="w-full py-4 rounded-xl font-display font-bold text-xl tracking-wider text-black active:scale-95 transition-transform"
            style={{ background: '#c9963a' }}
          >
            LET'S GO →
          </button>
        </div>
      )}
    </div>
  );
}
