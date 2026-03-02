import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckIn } from '../hooks/useCheckIn';
import { PageHeader } from '../components/layout/PageHeader';
import { QuickInput } from '../components/ui/QuickInput';
import { RatingSelector } from '../components/ui/RatingSelector';
import type { DailyCheckIn } from '../types';
import { today } from '../utils/date-helpers';

export function CheckInPage() {
  const navigate = useNavigate();
  const { todayEntry, add, update } = useCheckIn();

  const [sleepHours, setSleepHours] = useState<number | ''>(todayEntry?.sleepHours ?? 7);
  const [sleepQuality, setSleepQuality] = useState(todayEntry?.sleepQuality ?? 3);
  const [energyLevel, setEnergyLevel] = useState(todayEntry?.energyLevel ?? 3);
  const [stressLevel, setStressLevel] = useState(todayEntry?.stressLevel ?? 3);
  const [soreness, setSoreness] = useState(todayEntry?.soreness ?? 3);
  const [hunger, setHunger] = useState(todayEntry?.hunger ?? 3);
  const [mood, setMood] = useState(todayEntry?.mood ?? 3);
  const [digestion, setDigestion] = useState(todayEntry?.digestion ?? 3);
  const [didCardio, setDidCardio] = useState(todayEntry?.didCardio ?? false);
  const [didResistance, setDidResistance] = useState(todayEntry?.didResistance ?? false);
  const [notes, setNotes] = useState(todayEntry?.notes ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const entry: DailyCheckIn = {
      id: todayEntry?.id || crypto.randomUUID(),
      date: today(),
      sleepHours: typeof sleepHours === 'number' ? sleepHours : 7,
      sleepQuality,
      energyLevel,
      stressLevel,
      stressSource: todayEntry?.stressSource ?? null,
      fastingStatus: todayEntry?.fastingStatus ?? 'fasting',
      oneWord: todayEntry?.oneWord ?? '',
      soreness,
      hunger,
      mood,
      digestion,
      didCardio,
      didResistance,
      claudeDirective: todayEntry?.claudeDirective ?? null,
      notes,
      createdAt: todayEntry?.createdAt || new Date().toISOString(),
    };

    if (todayEntry) {
      update(todayEntry.id, entry);
    } else {
      add(entry);
    }

    setSaved(true);
    setTimeout(() => navigate(-1), 600);
  };

  return (
    <div>
      <PageHeader title="Daily Check-In" />
      <div className="px-4 py-4 space-y-5">
        <QuickInput
          label="Sleep Hours"
          value={sleepHours}
          onChange={setSleepHours}
          step={0.5}
          min={0}
          max={12}
          unit="hrs"
        />

        <RatingSelector label="Sleep Quality" value={sleepQuality} onChange={setSleepQuality} lowLabel="Terrible" highLabel="Great" />
        <RatingSelector label="Energy Level" value={energyLevel} onChange={setEnergyLevel} lowLabel="Drained" highLabel="Wired" />
        <RatingSelector label="Stress" value={stressLevel} onChange={setStressLevel} lowLabel="Calm" highLabel="Maxed" />
        <RatingSelector label="Soreness" value={soreness} onChange={setSoreness} lowLabel="Fresh" highLabel="Wrecked" />
        <RatingSelector label="Hunger" value={hunger} onChange={setHunger} lowLabel="None" highLabel="Starving" />
        <RatingSelector label="Mood" value={mood} onChange={setMood} lowLabel="Low" highLabel="Great" />
        <RatingSelector label="Digestion" value={digestion} onChange={setDigestion} lowLabel="Bad" highLabel="Perfect" />

        {/* Training toggles */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setDidResistance(!didResistance)}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
              didResistance ? 'bg-gold text-surface-dark' : 'bg-surface-alt text-muted'
            }`}
          >
            🏋️ Resistance
          </button>
          <button
            type="button"
            onClick={() => setDidCardio(!didCardio)}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
              didCardio ? 'bg-gold text-surface-dark' : 'bg-surface-alt text-muted'
            }`}
          >
            🚴 Cardio
          </button>
        </div>

        <div>
          <label className="text-sm text-muted">Notes (optional)</label>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anything worth noting..."
            className="w-full bg-surface-alt rounded-lg px-4 py-2.5 mt-1 text-sm outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>

        <button
          onClick={handleSave}
          className={`w-full py-3.5 rounded-xl font-semibold text-base active:scale-[0.98] transition-all ${
            saved ? 'bg-success' : 'bg-gold text-surface-dark'
          }`}
        >
          {saved ? '✓ Saved!' : todayEntry ? 'Update Check-In' : 'Save Check-In'}
        </button>
      </div>
    </div>
  );
}
