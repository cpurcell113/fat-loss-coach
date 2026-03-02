import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckIn } from '../hooks/useCheckIn';
import { useNutrition } from '../hooks/useNutrition';
import { useBodyComp } from '../hooks/useBodyComp';
import { usePerformance } from '../hooks/usePerformance';
import { useCountdown } from '../hooks/useCountdown';
import { useStreaks } from '../hooks/useStreaks';
import { useProjections } from '../hooks/useProjections';
import { getSettings } from '../data/storage';
import { BASELINE, TARGETS, PROTEIN_TARGET } from '../constants/baseline';
import { CALORIE_RANGE } from '../constants/macros';
import type { AppSettings, DailyCheckIn } from '../types';
import { today, formatDisplay } from '../utils/date-helpers';
import { Settings, ChevronRight, Flame, Zap, Moon } from 'lucide-react';

// ─── Check-In Modal ────────────────────────────────────────────────────────────
function CheckInModal({
  onComplete,
  onDismiss,
}: {
  onComplete: (entry: Partial<DailyCheckIn>) => void;
  onDismiss: () => void;
}) {
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(7);
  const [stressLevel, setStressLevel] = useState(4);
  const [stressSource, setStressSource] = useState('All clear');
  const [fastingStatus, setFastingStatus] = useState<'fasting' | 'window-open'>('fasting');
  const [oneWord, setOneWord] = useState('');

  const handleSubmit = () => {
    onComplete({
      sleepHours,
      sleepQuality,
      energyLevel,
      stressLevel,
      stressSource: stressLevel > 5 ? stressSource : null,
      fastingStatus,
      oneWord,
      soreness: 3,
      hunger: 3,
      mood: Math.round(energyLevel / 2),
      digestion: 3,
      didCardio: false,
      didResistance: false,
      claudeDirective: null,
      notes: '',
    });
  };

  const stressSources = ['Work', 'Financial', 'Family', 'Health', 'All clear'];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-lg rounded-t-3xl p-6 pb-10" style={{ background: '#1a1a1a' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-gold tracking-wide">DAILY CHECK-IN</h2>
            <p className="text-xs text-muted mt-0.5">{formatDisplay(today())}</p>
          </div>
          <button onClick={onDismiss} className="text-muted text-sm">Skip</button>
        </div>

        <div className="space-y-5">
          {/* Sleep */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium">Sleep last night</label>
              <span className="font-number text-gold text-sm">{sleepHours}h</span>
            </div>
            <input
              type="range" min={4} max={10} step={0.5}
              value={sleepHours}
              onChange={e => setSleepHours(Number(e.target.value))}
              className="w-full accent-gold"
            />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-muted">Quality</span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setSleepQuality(n)}
                    className={`text-lg ${n <= sleepQuality ? 'text-gold' : 'text-muted'}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Energy */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium">Energy right now</label>
              <span className="font-number text-gold text-sm">{energyLevel}/10</span>
            </div>
            <input
              type="range" min={1} max={10} step={1}
              value={energyLevel}
              onChange={e => setEnergyLevel(Number(e.target.value))}
              className="w-full accent-gold"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>Drained</span><span>Wired</span>
            </div>
          </div>

          {/* Stress */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium">Stress level</label>
              <span className="font-number text-gold text-sm">{stressLevel}/10</span>
            </div>
            <input
              type="range" min={1} max={10} step={1}
              value={stressLevel}
              onChange={e => setStressLevel(Number(e.target.value))}
              className="w-full accent-gold"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>Calm</span><span>Maxed</span>
            </div>
          </div>

          {/* Stress source (only if stress > 5) */}
          {stressLevel > 5 && (
            <div>
              <label className="text-xs text-muted mb-2 block">Stress source</label>
              <div className="flex flex-wrap gap-2">
                {stressSources.map(s => (
                  <button key={s} onClick={() => setStressSource(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      stressSource === s
                        ? 'bg-gold text-black'
                        : 'text-muted'
                    }`}
                    style={stressSource !== s ? { background: '#2a2a2a' } : {}}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fasting status */}
          <div>
            <label className="text-xs text-muted mb-2 block">Fasting status</label>
            <div className="flex gap-2">
              {(['fasting', 'window-open'] as const).map(s => (
                <button key={s} onClick={() => setFastingStatus(s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                    fastingStatus === s ? 'bg-gold text-black' : 'text-muted'
                  }`}
                  style={fastingStatus !== s ? { background: '#2a2a2a' } : {}}
                >
                  {s === 'fasting' ? 'Still fasting' : 'Window open'}
                </button>
              ))}
            </div>
          </div>

          {/* One word */}
          <div>
            <label className="text-xs text-muted mb-1 block">One word — how are you showing up today?</label>
            <input
              type="text"
              value={oneWord}
              onChange={e => setOneWord(e.target.value.split(' ')[0])}
              placeholder="Focused · Ready · Grounded..."
              maxLength={20}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: '#2a2a2a', color: '#f0ece4' }}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full mt-6 py-3.5 rounded-xl font-display font-bold text-lg tracking-wider text-black active:scale-[0.98] transition-all"
          style={{ background: '#c9963a' }}
        >
          SET THE DAY
        </button>
      </div>
    </div>
  );
}

// ─── Schedule helper ───────────────────────────────────────────────────────────
function getTodaySchedule() {
  const day = new Date().getDay(); // 0=Sun
  const schedule: Record<number, { training: string; hasSprint: boolean }> = {
    0: { training: 'Strength A', hasSprint: false },
    1: { training: 'Echo Sprints', hasSprint: true },
    2: { training: 'Strength B', hasSprint: false },
    3: { training: 'Echo Sprints', hasSprint: true },
    4: { training: 'Strength C + Echo Sprints', hasSprint: true },
    5: { training: 'Priority Session + Echo Sprints', hasSprint: true },
    6: { training: 'Active Recovery', hasSprint: false },
  };
  return schedule[day];
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function HomePage() {
  const navigate = useNavigate();
  const settings = getSettings<AppSettings>('settings');

  const { todayEntry: todayCheckIn, add: addCheckIn } = useCheckIn();
  const { todayEntry: todayNutrition } = useNutrition();
  const { entries: bodyComp, latest } = useBodyComp();
  const { sessions: sprints } = usePerformance();
  const { entries: checkIns } = useCheckIn();
  const { entries: nutrition } = useNutrition();
  const { currentWeek, totalWeeks, daysRemaining, progressPercent } = useCountdown();
  const { morningStreak, proteinStreak, sprintWeek } = useStreaks(checkIns, nutrition, sprints);
  const projections = useProjections(bodyComp);

  const [showCheckIn, setShowCheckIn] = useState(false);

  // Auto-trigger check-in on first open each day
  useEffect(() => {
    const dismissKey = `checkin_dismissed_${today()}`;
    const wasDismissed = localStorage.getItem(dismissKey);
    if (!todayCheckIn && !wasDismissed && settings?.onboardingComplete) {
      setShowCheckIn(true);
    }
  }, [todayCheckIn, settings?.onboardingComplete]);

  const handleCheckInComplete = useCallback((data: Partial<DailyCheckIn>) => {
    const entry: DailyCheckIn = {
      id: crypto.randomUUID(),
      date: today(),
      sleepHours: data.sleepHours ?? 7,
      sleepQuality: data.sleepQuality ?? 3,
      energyLevel: data.energyLevel ?? 5,
      stressLevel: data.stressLevel ?? 5,
      stressSource: data.stressSource ?? null,
      fastingStatus: data.fastingStatus ?? 'fasting',
      oneWord: data.oneWord ?? '',
      soreness: data.soreness ?? 3,
      hunger: data.hunger ?? 3,
      mood: data.mood ?? 3,
      digestion: data.digestion ?? 3,
      didCardio: false,
      didResistance: false,
      claudeDirective: null,
      notes: '',
      createdAt: new Date().toISOString(),
    };
    addCheckIn(entry);
    setShowCheckIn(false);
  }, [addCheckIn]);

  const handleDismissCheckIn = useCallback(() => {
    localStorage.setItem(`checkin_dismissed_${today()}`, 'true');
    setShowCheckIn(false);
  }, []);

  if (!settings?.onboardingComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="font-display text-3xl font-bold leading-snug mb-6" style={{ color: '#f0ece4' }}>
          <span>My family won't need</span><br/>
          <span style={{ color: '#c9963a' }}>to heal from the work</span><br/>
          <span>I didn't do.</span>
        </div>
        <button
          onClick={() => navigate('/onboarding')}
          className="px-8 py-3 rounded-xl font-display font-bold text-lg tracking-wide text-black active:scale-95 transition-transform"
          style={{ background: '#c9963a' }}
        >
          BEGIN
        </button>
      </div>
    );
  }

  const schedule = getTodaySchedule();
  const weightDelta = latest ? +(latest.weight - BASELINE.weight).toFixed(1) : null;
  const proteinHit = todayNutrition && todayNutrition.protein >= PROTEIN_TARGET;

  return (
    <div className="overflow-y-auto">
      {/* Covenant Header */}
      <div className="px-5 pt-6 pb-4 relative">
        <button
          onClick={() => navigate('/settings')}
          className="absolute top-5 right-4 p-2 text-muted"
        >
          <Settings size={18} />
        </button>
        <p className="text-xs text-muted tracking-widest uppercase mb-3">All In</p>
        <div className="font-display font-bold leading-tight" style={{ fontSize: '22px', color: '#f0ece4' }}>
          My family won't need<br/>
          <span style={{ color: '#c9963a' }}>to heal from the work</span><br/>
          I didn't do.
        </div>
        <p className="text-xs text-muted mt-2">{formatDisplay(today())}</p>
      </div>

      {/* 90-Day Progress */}
      <div className="px-4 mb-3">
        <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted">DAY {Math.round(progressPercent * 0.9)}/90</span>
            <span className="text-xs font-medium" style={{ color: '#c9963a' }}>
              {daysRemaining}d remaining
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#2a2a2a' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressPercent}%`, background: '#c9963a' }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted">
            <span>Week {currentWeek} of {totalWeeks}</span>
            {projections.projectedWeight && (
              <span>
                → proj. {projections.projectedWeight.toFixed(1)} lbs by May 12
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-4 mb-3 grid grid-cols-3 gap-2">
        {[
          {
            label: 'Weight',
            value: latest ? `${latest.weight.toFixed(1)}` : '--',
            unit: 'lbs',
            delta: weightDelta,
            good: 'down',
          },
          {
            label: 'Body Fat',
            value: latest?.bodyFatPercent ? `${latest.bodyFatPercent.toFixed(1)}` : '--',
            unit: '%',
            delta: latest?.bodyFatPercent ? +(latest.bodyFatPercent - BASELINE.bodyFatPercent).toFixed(1) : null,
            good: 'down',
          },
          {
            label: 'Muscle',
            value: latest?.muscleMass ? `${latest.muscleMass.toFixed(1)}` : '--',
            unit: 'lbs',
            delta: latest?.muscleMass ? +(latest.muscleMass - BASELINE.muscleMass).toFixed(1) : null,
            good: 'up',
          },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <p className="text-muted text-[10px] uppercase tracking-wider mb-1">{s.label}</p>
            <p className="font-number font-bold text-lg leading-none" style={{ color: '#f0ece4' }}>
              {s.value}<span className="text-xs text-muted font-sans ml-0.5">{s.unit}</span>
            </p>
            {s.delta !== null && (
              <p className={`text-[10px] mt-1 font-number ${
                (s.good === 'down' ? s.delta < 0 : s.delta > 0)
                  ? 'text-success'
                  : s.delta === 0 ? 'text-muted'
                  : 'text-danger'
              }`}>
                {s.delta > 0 ? '+' : ''}{s.delta}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Today's Plan */}
      <div className="px-4 mb-3">
        <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid rgba(201,150,58,0.25)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-base tracking-wide" style={{ color: '#c9963a' }}>
              TODAY'S PLAN
            </h2>
            <button onClick={() => navigate('/train')} className="text-muted">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-base">🏋️</span>
              <div>
                <p className="font-medium" style={{ color: '#f0ece4' }}>{schedule.training}</p>
                {schedule.hasSprint && (
                  <p className="text-xs text-muted">20 rounds · 15s ON / 45s OFF · beat 7.03mi</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-base">🥩</span>
              <div>
                <p className="font-medium" style={{ color: '#f0ece4' }}>
                  {PROTEIN_TARGET}g protein
                  {proteinHit && <span className="text-success ml-2 text-xs">✓ Hit</span>}
                </p>
                <p className="text-xs text-muted">
                  {CALORIE_RANGE.min}–{CALORIE_RANGE.max} cal · window 3:30–9:30pm
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-base">⚓</span>
              <div>
                <p className="font-medium" style={{ color: '#f0ece4' }}>Evening anchor</p>
                <p className="text-xs text-muted">Icelandic skyr + 2 scoops Levels (~65g protein)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Check-In Directive */}
      {todayCheckIn ? (
        <div className="px-4 mb-3">
          <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#c9963a' }} />
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Check-In Complete</p>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-muted text-xs">Sleep</p>
                <p className="font-number font-semibold">{todayCheckIn.sleepHours}h</p>
              </div>
              <div>
                <p className="text-muted text-xs">Energy</p>
                <p className="font-number font-semibold">{todayCheckIn.energyLevel}/10</p>
              </div>
              <div>
                <p className="text-muted text-xs">Stress</p>
                <p className="font-number font-semibold">{todayCheckIn.stressLevel}/10</p>
              </div>
              {todayCheckIn.oneWord && (
                <div>
                  <p className="text-muted text-xs">Today</p>
                  <p className="font-semibold capitalize" style={{ color: '#c9963a' }}>{todayCheckIn.oneWord}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 mb-3">
          <button
            onClick={() => setShowCheckIn(true)}
            className="w-full rounded-xl p-4 text-left active:scale-[0.99] transition-transform"
            style={{ background: '#1a1a1a', border: '1px solid rgba(201,150,58,0.3)' }}
          >
            <p className="font-display font-bold text-sm tracking-wide" style={{ color: '#c9963a' }}>
              CHECK IN →
            </p>
            <p className="text-xs text-muted mt-0.5">Set today's foundation. Takes 30 seconds.</p>
          </button>
        </div>
      )}

      {/* Streaks */}
      <div className="px-4 mb-3">
        <h2 className="font-display font-bold text-xs tracking-widest text-muted uppercase mb-2">Streaks</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Moon, label: 'Check-In', value: morningStreak, unit: 'days' },
            { icon: Flame, label: 'Protein', value: proteinStreak, unit: 'days' },
            { icon: Zap, label: 'Sprints', value: sprintWeek, unit: '/7 wk' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
              <s.icon size={16} className="mx-auto mb-1" style={{ color: '#c9963a' }} />
              <p className="font-number font-bold text-xl leading-none" style={{ color: '#f0ece4' }}>
                {s.value}
                <span className="text-[10px] text-muted font-sans ml-0.5">{s.unit}</span>
              </p>
              <p className="text-[10px] text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Nav */}
      <div className="px-4 mb-6 grid grid-cols-2 gap-2">
        <button
          onClick={() => navigate('/projections')}
          className="rounded-xl p-3 text-left"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
        >
          <p className="text-xs text-muted">Projected end BF%</p>
          <p className="font-number font-bold text-lg" style={{ color: projections.projectedBf && projections.projectedBf <= TARGETS.bodyFatPercent ? '#4a7c59' : '#c9963a' }}>
            {projections.projectedBf ? `${projections.projectedBf.toFixed(1)}%` : '--'}
          </p>
          <p className="text-[10px] text-muted">Goal: {TARGETS.bodyFatPercent}%</p>
        </button>
        <button
          onClick={() => navigate('/bloodwork')}
          className="rounded-xl p-3 text-left"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
        >
          <p className="text-xs text-muted">ECW/TBW</p>
          <p className="font-number font-bold text-lg" style={{ color: latest?.ecwRatio && latest.ecwRatio >= 0.390 ? '#8b3a3a' : '#4a7c59' }}>
            {latest?.ecwRatio?.toFixed(3) ?? '--'}
          </p>
          <p className="text-[10px] text-muted">Goal: ≤{TARGETS.ecwRatioWarning}</p>
        </button>
      </div>

      {/* Check-in modal */}
      {showCheckIn && (
        <CheckInModal
          onComplete={handleCheckInComplete}
          onDismiss={handleDismissCheckIn}
        />
      )}
    </div>
  );
}
