import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNutrition } from '../hooks/useNutrition';
import { PageHeader } from '../components/layout/PageHeader';
import { QuickInput } from '../components/ui/QuickInput';
import { MacroBar } from '../components/ui/MacroBar';
import { MACRO_TARGETS } from '../constants/macros';
import { autoCalories } from '../utils/calculations';
import type { NutritionEntry } from '../types';
import { today } from '../utils/date-helpers';

export function NutritionPage() {
  const navigate = useNavigate();
  const { todayEntry, add, update } = useNutrition();

  const [protein, setProtein] = useState<number | ''>(todayEntry?.protein ?? '');
  const [carbs, setCarbs] = useState<number | ''>(todayEntry?.carbs ?? '');
  const [fats, setFats] = useState<number | ''>(todayEntry?.fats ?? '');
  const [fiber, setFiber] = useState<number | ''>(todayEntry?.fiber ?? '');
  const [water, setWater] = useState<number | ''>(todayEntry?.water ?? '');
  const [notes, setNotes] = useState(todayEntry?.notes ?? '');
  const [saved, setSaved] = useState(false);

  const p = typeof protein === 'number' ? protein : 0;
  const c = typeof carbs === 'number' ? carbs : 0;
  const f = typeof fats === 'number' ? fats : 0;
  const calories = autoCalories(p, c, f);

  const handleSave = () => {
    const entry: NutritionEntry = {
      id: todayEntry?.id || crypto.randomUUID(),
      date: today(),
      protein: p,
      carbs: c,
      fats: f,
      calories,
      fiber: typeof fiber === 'number' ? fiber : null,
      water: typeof water === 'number' ? water : null,
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
      <PageHeader title="Nutrition" />
      <div className="px-4 py-4 space-y-5">
        {/* Macro progress bars */}
        <div className="space-y-3 bg-surface rounded-xl p-4 ring-1 ring-white/10">
          <MacroBar label="Protein" value={p} min={MACRO_TARGETS.protein.min} max={MACRO_TARGETS.protein.max} color="bg-blue-500" />
          <MacroBar label="Carbs" value={c} min={MACRO_TARGETS.carbs.min} max={MACRO_TARGETS.carbs.max} color="bg-amber-500" />
          <MacroBar label="Fats" value={f} min={MACRO_TARGETS.fats.min} max={MACRO_TARGETS.fats.max} color="bg-pink-500" />
          <div className="flex justify-between text-sm pt-1 border-t border-white/10">
            <span className="text-muted">Calories</span>
            <span className="font-semibold tabular-nums">{calories} cal</span>
          </div>
        </div>

        {/* Inputs */}
        <QuickInput
          label="Protein"
          value={protein}
          onChange={setProtein}
          step={5}
          unit="g"
          hint={`${MACRO_TARGETS.protein.min}-${MACRO_TARGETS.protein.max}g`}
        />
        <QuickInput
          label="Carbs"
          value={carbs}
          onChange={setCarbs}
          step={5}
          unit="g"
          hint={`${MACRO_TARGETS.carbs.min}-${MACRO_TARGETS.carbs.max}g`}
        />
        <QuickInput
          label="Fats"
          value={fats}
          onChange={setFats}
          step={1}
          unit="g"
          hint={`${MACRO_TARGETS.fats.min}-${MACRO_TARGETS.fats.max}g`}
        />

        {/* Optional fields */}
        <details className="group">
          <summary className="text-sm text-muted cursor-pointer">Optional: Fiber & Water</summary>
          <div className="mt-3 space-y-4">
            <QuickInput label="Fiber" value={fiber} onChange={setFiber} step={1} unit="g" />
            <QuickInput label="Water" value={water} onChange={setWater} step={8} unit="oz" />
          </div>
        </details>

        <div>
          <label className="text-sm text-muted">Notes (optional)</label>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="What did you eat..."
            className="w-full bg-surface-alt rounded-lg px-4 py-2.5 mt-1 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <button
          onClick={handleSave}
          className={`w-full py-3.5 rounded-xl font-semibold text-base active:scale-[0.98] transition-all ${
            saved ? 'bg-success' : 'bg-primary'
          }`}
        >
          {saved ? '✓ Saved!' : todayEntry ? 'Update Macros' : 'Save Macros'}
        </button>
      </div>
    </div>
  );
}
