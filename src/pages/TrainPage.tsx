import { useState, useEffect, useRef } from 'react';
import { usePerformance } from '../hooks/usePerformance';
import { useStrengthSessions } from '../hooks/useStrengthSessions';
import { PageHeader } from '../components/layout/PageHeader';
import type { SprintSession, StrengthSession, Exercise } from '../types';
import { today, formatDisplay } from '../utils/date-helpers';
import { Play, Pause, RotateCcw, Plus, Trash2, Trophy } from 'lucide-react';

const WORK_SECS = 15;
const REST_SECS = 45;
const TOTAL_ROUNDS = 20;
const PR_MILES = 7.03;

// ─── Sprint Timer ──────────────────────────────────────────────────────────────
interface TimerState {
  phase: 'idle' | 'work' | 'rest' | 'done';
  round: number;
  timeLeft: number;
  running: boolean;
}

function SprintTimer({ onSave }: { onSave: (session: SprintSession) => void }) {
  const [timer, setTimer] = useState<TimerState>({
    phase: 'idle',
    round: 0,
    timeLeft: WORK_SECS,
    running: false,
  });
  const [distance, setDistance] = useState('');
  const [rpe, setRpe] = useState(7);
  const [saved, setSaved] = useState(false);
  const { sessions } = usePerformance();

  const bestDistance = sessions.reduce((max, s) => Math.max(max, s.distance ?? 0), PR_MILES);

  const timerRef = useRef<TimerState>(timer);
  timerRef.current = timer;

  useEffect(() => {
    if (!timer.running || timer.phase === 'idle' || timer.phase === 'done') return;

    const id = setInterval(() => {
      const t = timerRef.current;
      if (!t.running) return;

      if (t.timeLeft <= 1) {
        // Transition phase
        if (t.phase === 'work') {
          const nextRound = t.round;
          if (nextRound >= TOTAL_ROUNDS) {
            setTimer({ phase: 'done', round: TOTAL_ROUNDS, timeLeft: 0, running: false });
          } else {
            setTimer({ phase: 'rest', round: nextRound, timeLeft: REST_SECS, running: true });
          }
        } else {
          // rest → work
          const nextRound = t.round + 1;
          if (nextRound > TOTAL_ROUNDS) {
            setTimer({ phase: 'done', round: TOTAL_ROUNDS, timeLeft: 0, running: false });
          } else {
            setTimer({ phase: 'work', round: nextRound, timeLeft: WORK_SECS, running: true });
          }
        }
      } else {
        setTimer(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }
    }, 1000);

    return () => clearInterval(id);
  }, [timer.running, timer.phase]);

  const start = () => {
    if (timer.phase === 'idle') {
      setTimer({ phase: 'work', round: 1, timeLeft: WORK_SECS, running: true });
    } else {
      setTimer(prev => ({ ...prev, running: true }));
    }
  };

  const pause = () => setTimer(prev => ({ ...prev, running: false }));

  const reset = () => {
    setTimer({ phase: 'idle', round: 0, timeLeft: WORK_SECS, running: false });
    setSaved(false);
    setDistance('');
  };

  const handleSave = () => {
    const dist = parseFloat(distance);
    const session: SprintSession = {
      id: crypto.randomUUID(),
      date: today(),
      type: 'treadmill',
      rounds: TOTAL_ROUNDS,
      workSeconds: WORK_SECS,
      restSeconds: REST_SECS,
      distance: isNaN(dist) ? null : dist,
      avgCalPerRound: null,
      peakCalPerRound: null,
      totalCalories: null,
      avgHeartRate: null,
      peakHeartRate: null,
      rpe,
      notes: '',
      createdAt: new Date().toISOString(),
    };
    onSave(session);
    setSaved(true);
  };

  const dist = parseFloat(distance);
  const isNewPR = !isNaN(dist) && dist > bestDistance;
  const { phase, round, timeLeft, running } = timer;
  const isWork = phase === 'work';
  const isDone = phase === 'done';

  return (
    <div className="space-y-4">
      {/* Timer display */}
      <div
        className="rounded-2xl p-6 text-center transition-colors duration-500"
        style={{
          background: isWork ? 'rgba(201,150,58,0.12)' : '#1a1a1a',
          border: `2px solid ${isWork ? '#c9963a' : '#2a2a2a'}`,
        }}
      >
        {phase === 'idle' && (
          <p className="font-display font-bold text-sm tracking-widest text-muted uppercase mb-2">
            ECHO SPRINTS · 20 ROUNDS
          </p>
        )}
        {isWork && (
          <p className="font-display font-bold text-xl tracking-widest uppercase mb-2" style={{ color: '#c9963a' }}>WORK</p>
        )}
        {phase === 'rest' && (
          <p className="font-display font-bold text-xl tracking-widest uppercase mb-2 text-muted">REST</p>
        )}
        {isDone && (
          <p className="font-display font-bold text-xl tracking-widest uppercase mb-2" style={{ color: '#4a7c59' }}>COMPLETE ✓</p>
        )}

        {!isDone && (
          <p className="font-number font-bold leading-none" style={{ fontSize: '80px', color: '#f0ece4' }}>
            {String(timeLeft).padStart(2, '0')}
          </p>
        )}

        {phase !== 'idle' && !isDone && (
          <p className="font-display font-bold text-base tracking-wide text-muted mt-1">
            ROUND {round} / {TOTAL_ROUNDS}
          </p>
        )}

        <div className="flex items-center justify-center gap-2 mt-3">
          <Trophy size={14} style={{ color: '#c9963a' }} />
          <p className="text-xs text-muted">PR: {bestDistance.toFixed(2)} mi</p>
        </div>
      </div>

      {/* Controls */}
      {!isDone && (
        <div className="flex gap-3">
          <button
            onClick={running ? pause : start}
            className="flex-1 py-4 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{ background: '#c9963a', color: '#000' }}
          >
            {running ? <Pause size={22} /> : <Play size={22} />}
          </button>
          {phase !== 'idle' && (
            <button onClick={reset} className="py-4 px-5 rounded-xl text-muted transition-all active:scale-95" style={{ background: '#2a2a2a' }}>
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      )}

      {/* Post-session */}
      {isDone && !saved && (
        <div className="rounded-xl p-4 space-y-4" style={{ background: '#1a1a1a', border: '1px solid rgba(201,150,58,0.25)' }}>
          <p className="font-display font-bold text-base tracking-wide" style={{ color: '#c9963a' }}>
            20 ROUNDS DONE. ENTER DISTANCE.
          </p>
          <div>
            <label className="text-xs text-muted">Distance (miles)</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number" value={distance} onChange={e => setDistance(e.target.value)}
                placeholder="0.00" step="0.01" inputMode="decimal"
                className="flex-1 rounded-xl px-4 py-2.5 text-2xl font-number outline-none"
                style={{ background: '#2a2a2a', color: '#f0ece4' }}
              />
              <span className="text-muted font-medium">mi</span>
            </div>
            {isNewPR && (
              <p className="text-sm font-bold mt-2 text-center" style={{ color: '#c9963a' }}>
                🔥 NEW PR! {dist.toFixed(2)} mi beats {bestDistance.toFixed(2)} mi
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">RPE (1–10)</label>
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setRpe(n)} className="flex-1 py-2 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: n <= rpe ? '#c9963a' : '#2a2a2a', color: n <= rpe ? '#000' : '#4a4845' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 py-3 rounded-xl text-sm text-muted" style={{ background: '#2a2a2a' }}>Discard</button>
            <button onClick={handleSave} className="flex-1 py-3 rounded-xl font-display font-bold text-base tracking-wide text-black" style={{ background: '#c9963a' }}>
              SAVE SESSION
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div className="rounded-xl p-4 text-center" style={{ background: '#1a2a1a', border: '1px solid #4a7c59' }}>
          <p className="font-display font-bold text-lg tracking-wide" style={{ color: '#4a7c59' }}>SESSION SAVED ✓</p>
          <button onClick={reset} className="text-sm text-muted mt-2">Log another</button>
        </div>
      )}
    </div>
  );
}

// ─── Strength Logger ───────────────────────────────────────────────────────────
function StrengthLogger({ onSave }: { onSave: (s: StrengthSession) => void }) {
  const [label, setLabel] = useState<'A' | 'B' | 'C'>('A');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [rpe, setRpe] = useState(7);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const addExercise = () => {
    setExercises(prev => [...prev, { name: '', sets: 3, reps: '8-10', weight: null, rpe: null, notes: '' }]);
  };

  const updateEx = (i: number, field: keyof Exercise, value: string | number | null) => {
    setExercises(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };

  const removeEx = (i: number) => setExercises(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (exercises.length === 0) return;
    onSave({
      id: crypto.randomUUID(),
      date: today(),
      label,
      exercises,
      duration: null,
      notes,
      rpe,
      createdAt: new Date().toISOString(),
    });
    setSaved(true);
    setExercises([]);
    setNotes('');
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
        <p className="text-xs text-muted mb-2">Session</p>
        <div className="flex gap-2">
          {(['A', 'B', 'C'] as const).map(l => (
            <button key={l} onClick={() => setLabel(l)}
              className="flex-1 py-2.5 rounded-xl font-display font-bold text-lg tracking-wider transition-colors"
              style={{ background: label === l ? '#c9963a' : '#2a2a2a', color: label === l ? '#000' : '#4a4845' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {exercises.map((ex, i) => (
          <div key={i} className="rounded-xl p-3" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <div className="flex gap-2 mb-2">
              <input value={ex.name} onChange={e => updateEx(i, 'name', e.target.value)}
                placeholder="Exercise name" className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
                style={{ background: '#2a2a2a', color: '#f0ece4' }} />
              <button onClick={() => removeEx(i)} className="text-muted p-2"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Sets', value: ex.sets, field: 'sets' as const },
                { label: 'Reps', value: ex.reps, field: 'reps' as const },
                { label: 'Weight', value: ex.weight ?? '', field: 'weight' as const },
              ].map(f => (
                <div key={f.field}>
                  <p className="text-[10px] text-muted mb-0.5">{f.label}</p>
                  <input value={String(f.value)} onChange={e => updateEx(i, f.field, e.target.value || (f.field === 'weight' ? null : e.target.value))}
                    placeholder={f.field === 'reps' ? '8-10' : '--'}
                    className="w-full text-sm px-2 py-1.5 rounded-lg outline-none font-number text-center"
                    style={{ background: '#2a2a2a', color: '#f0ece4' }}
                    inputMode={f.field === 'reps' ? 'text' : 'numeric'} />
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={addExercise} className="w-full py-3 rounded-xl text-sm text-muted flex items-center justify-center gap-2"
          style={{ background: '#1a1a1a', border: '1px dashed #2a2a2a' }}>
          <Plus size={16} /> Add Exercise
        </button>
      </div>

      <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
        <p className="text-xs text-muted mb-2">Session RPE: {rpe}/10</p>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setRpe(n)} className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: n <= rpe ? '#c9963a' : '#2a2a2a', color: n <= rpe ? '#000' : '#4a4845' }}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Session notes..."
        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
        style={{ background: '#1a1a1a', color: '#f0ece4', border: '1px solid #2a2a2a' }} />

      <button onClick={handleSave} disabled={exercises.length === 0}
        className="w-full py-3.5 rounded-xl font-display font-bold text-base tracking-wide transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ background: saved ? '#4a7c59' : '#c9963a', color: saved ? '#fff' : '#000' }}>
        {saved ? '✓ SESSION SAVED' : 'SAVE SESSION'}
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function TrainPage() {
  const [tab, setTab] = useState<'sprint' | 'strength'>('sprint');
  const { sessions: sprintSessions, add: addSprint } = usePerformance();
  const { sessions: strengthSessions, add: addStrength } = useStrengthSessions();

  return (
    <div>
      <PageHeader title="Train" />
      <div className="px-4 py-4 space-y-4">
        <div className="flex rounded-xl p-1" style={{ background: '#1a1a1a' }}>
          {(['sprint', 'strength'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-lg font-display font-bold text-sm tracking-wide transition-colors"
              style={{ background: tab === t ? '#c9963a' : 'transparent', color: tab === t ? '#000' : '#4a4845' }}>
              {t === 'sprint' ? 'ECHO SPRINTS' : 'STRENGTH'}
            </button>
          ))}
        </div>

        {tab === 'sprint' && (
          <>
            <SprintTimer onSave={addSprint} />
            {sprintSessions.slice(0, 5).length > 0 && (
              <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                <h3 className="font-display font-bold text-xs tracking-widest text-muted uppercase mb-3">Recent Sprints</h3>
                <div className="space-y-2">
                  {sprintSessions.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-muted/10 last:border-0">
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#f0ece4' }}>
                          {s.distance ? `${s.distance.toFixed(2)} mi` : `${s.rounds} rounds`}
                          {s.distance && s.distance >= PR_MILES && (
                            <span className="ml-2 text-xs" style={{ color: '#c9963a' }}>PR</span>
                          )}
                        </p>
                        <p className="text-xs text-muted">{formatDisplay(s.date)} · RPE {s.rpe}/10</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'strength' && (
          <>
            <StrengthLogger onSave={addStrength} />
            {strengthSessions.slice(0, 3).length > 0 && (
              <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                <h3 className="font-display font-bold text-xs tracking-widest text-muted uppercase mb-3">Recent Sessions</h3>
                <div className="space-y-2">
                  {strengthSessions.slice(0, 3).map(s => (
                    <div key={s.id} className="py-1.5 border-b border-muted/10 last:border-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium" style={{ color: '#f0ece4' }}>
                          Session {s.label} · {s.exercises.length} exercises
                        </p>
                        <p className="text-xs text-muted">{formatDisplay(s.date)}</p>
                      </div>
                      {s.exercises.length > 0 && (
                        <p className="text-xs text-muted mt-0.5 truncate">
                          {s.exercises.map(e => e.name).filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
