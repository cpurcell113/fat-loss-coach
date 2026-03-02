import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePerformance } from '../hooks/usePerformance';
import { PageHeader } from '../components/layout/PageHeader';
import { QuickInput } from '../components/ui/QuickInput';
import { RatingSelector } from '../components/ui/RatingSelector';
import { Card } from '../components/ui/Card';
import type { SprintSession } from '../types';
import { today, formatDisplay } from '../utils/date-helpers';

export function PerformancePage() {
  const navigate = useNavigate();
  const { sessions, add } = usePerformance();

  const [rounds, setRounds] = useState<number | ''>(20);
  const [totalCalories, setTotalCalories] = useState<number | ''>('');
  const [avgCalPerRound, setAvgCalPerRound] = useState<number | ''>('');
  const [peakHeartRate, setPeakHeartRate] = useState<number | ''>('');
  const [rpe, setRpe] = useState(7);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const session: SprintSession = {
      id: crypto.randomUUID(),
      date: today(),
      type: 'echo-bike',
      rounds: typeof rounds === 'number' ? rounds : 20,
      workSeconds: 15,
      restSeconds: 45,
      distance: null,
      avgCalPerRound: typeof avgCalPerRound === 'number' ? avgCalPerRound : null,
      peakCalPerRound: null,
      totalCalories: typeof totalCalories === 'number' ? totalCalories : null,
      avgHeartRate: null,
      peakHeartRate: typeof peakHeartRate === 'number' ? peakHeartRate : null,
      rpe,
      notes,
      createdAt: new Date().toISOString(),
    };

    add(session);
    setSaved(true);
    setTotalCalories('');
    setAvgCalPerRound('');
    setPeakHeartRate('');
    setNotes('');
    setTimeout(() => {
      setSaved(false);
      navigate(-1);
    }, 600);
  };

  return (
    <div>
      <PageHeader title="Sprint Session" />
      <div className="px-4 py-4 space-y-4">
        <Card>
          <h3 className="text-sm font-medium mb-1">Echo Bike Intervals</h3>
          <p className="text-xs text-muted mb-4">15s on / 45s off</p>

          <div className="space-y-4">
            <QuickInput label="Rounds" value={rounds} onChange={setRounds} step={1} min={1} max={30} />
            <QuickInput label="Total Calories" value={totalCalories} onChange={setTotalCalories} step={1} unit="cal" />
            <QuickInput label="Avg Cal/Round" value={avgCalPerRound} onChange={setAvgCalPerRound} step={0.1} unit="cal" />
            <QuickInput label="Peak Heart Rate" value={peakHeartRate} onChange={setPeakHeartRate} step={1} unit="bpm" />

            <RatingSelector
              label="RPE (Rate of Perceived Exertion)"
              value={rpe}
              onChange={setRpe}
              max={10}
              lowLabel="Easy"
              highLabel="Max effort"
            />

            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How did the session feel..."
              className="w-full bg-surface-alt rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/30"
            />

            <button
              onClick={handleSave}
              className={`w-full py-3 rounded-xl font-semibold active:scale-[0.98] transition-all ${
                saved ? 'bg-success' : 'bg-gold text-surface-dark'
              }`}
            >
              {saved ? '✓ Saved!' : 'Save Session'}
            </button>
          </div>
        </Card>

        {/* Recent sessions */}
        {sessions.length > 0 && (
          <Card>
            <h3 className="text-sm font-medium mb-3">Recent Sessions</h3>
            <div className="space-y-2">
              {[...sessions].reverse().slice(0, 10).map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gold/10 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{s.rounds} rounds · RPE {s.rpe}/10</p>
                    <p className="text-xs text-muted">
                      {formatDisplay(s.date)}
                      {s.totalCalories && ` · ${s.totalCalories} cal`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
