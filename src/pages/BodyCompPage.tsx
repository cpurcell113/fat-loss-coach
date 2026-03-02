import { useState } from 'react';
import { useBodyComp } from '../hooks/useBodyComp';
import { PageHeader } from '../components/layout/PageHeader';
import { QuickInput } from '../components/ui/QuickInput';
import { Card } from '../components/ui/Card';
import { WeightTrendChart } from '../components/charts/WeightTrendChart';
import type { BodyCompEntry } from '../types';
import { today, formatDisplay } from '../utils/date-helpers';
import { Trash2 } from 'lucide-react';

export function BodyCompPage() {
  const { entries, add, remove } = useBodyComp();

  const [weight, setWeight] = useState<number | ''>('');
  const [muscleMass, setMuscleMass] = useState<number | ''>('');
  const [bodyFatPercent, setBodyFatPercent] = useState<number | ''>('');
  const [ecwRatio, setEcwRatio] = useState<number | ''>('');
  const [source, setSource] = useState<'scale' | 'inbody' | 'dexa'>('scale');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (typeof weight !== 'number') return;

    const entry: BodyCompEntry = {
      id: crypto.randomUUID(),
      date: today(),
      weight,
      muscleMass: typeof muscleMass === 'number' ? muscleMass : null,
      bodyFatPercent: typeof bodyFatPercent === 'number' ? bodyFatPercent : null,
      ecwRatio: typeof ecwRatio === 'number' ? ecwRatio : null,
      notes,
      source,
      createdAt: new Date().toISOString(),
    };

    add(entry);
    setSaved(true);
    setWeight('');
    setMuscleMass('');
    setBodyFatPercent('');
    setEcwRatio('');
    setNotes('');
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div>
      <PageHeader title="Body Composition" />
      <div className="px-4 py-4 space-y-4">
        {/* Input form */}
        <Card>
          <h3 className="text-sm font-medium mb-3">New Measurement</h3>
          <div className="space-y-4">
            <QuickInput label="Weight" value={weight} onChange={setWeight} step={0.1} unit="lbs" />
            <QuickInput label="Skeletal Muscle Mass" value={muscleMass} onChange={setMuscleMass} step={0.1} unit="lbs" hint="InBody/DEXA" />
            <QuickInput label="Body Fat %" value={bodyFatPercent} onChange={setBodyFatPercent} step={0.1} unit="%" />
            <QuickInput label="ECW Ratio" value={ecwRatio} onChange={setEcwRatio} step={0.001} min={0.3} max={0.5} hint="Normal: 0.360-0.390" />

            <div>
              <label className="text-sm text-muted">Source</label>
              <div className="flex gap-2 mt-1">
                {(['scale', 'inbody', 'dexa'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSource(s)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      source === s ? 'bg-gold text-surface-dark' : 'bg-surface-alt text-muted'
                    }`}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes..."
              className="w-full bg-surface-alt rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/30"
            />

            <button
              onClick={handleSave}
              disabled={typeof weight !== 'number'}
              className={`w-full py-3 rounded-xl font-semibold active:scale-[0.98] transition-all disabled:opacity-40 ${
                saved ? 'bg-success' : 'bg-gold text-surface-dark'
              }`}
            >
              {saved ? '✓ Saved!' : 'Save Measurement'}
            </button>
          </div>
        </Card>

        {/* Weight chart */}
        {entries.length > 0 && (
          <Card>
            <h3 className="text-sm font-medium mb-2">Weight Trend</h3>
            <WeightTrendChart entries={entries} />
          </Card>
        )}

        {/* History */}
        <Card>
          <h3 className="text-sm font-medium mb-3">History</h3>
          <div className="space-y-2">
            {[...entries].reverse().map(entry => (
              <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gold/10 last:border-0">
                <div>
                  <p className="text-sm font-medium tabular-nums">{entry.weight} lbs</p>
                  <p className="text-xs text-muted">
                    {formatDisplay(entry.date)}
                    {entry.bodyFatPercent && ` · ${entry.bodyFatPercent}% BF`}
                    {entry.muscleMass && ` · ${entry.muscleMass} lbs muscle`}
                  </p>
                </div>
                {entry.id !== 'baseline' && (
                  <button onClick={() => remove(entry.id)} className="p-2 text-muted">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
