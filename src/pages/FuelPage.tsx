import { useState, useEffect } from 'react';
import { useNutrition } from '../hooks/useNutrition';
import { PageHeader } from '../components/layout/PageHeader';
import { MACRO_TARGETS, CALORIE_RANGE } from '../constants/macros';
import { PROTEIN_TARGET } from '../constants/baseline';
import { autoCalories } from '../utils/calculations';
import type { NutritionEntry } from '../types';
import { today } from '../utils/date-helpers';

// ─── Fasting Timer ─────────────────────────────────────────────────────────────
function useFastingTimer() {
  const [info, setInfo] = useState({ label: '', sub: '', isOpen: false });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const mins = h * 60 + m;

      const openAt = 15 * 60 + 30;  // 3:30pm
      const closeAt = 21 * 60 + 30; // 9:30pm
      const nextOpenAt = 24 * 60 + openAt; // next day 3:30pm

      if (mins >= openAt && mins < closeAt) {
        const remaining = closeAt - mins;
        const rh = Math.floor(remaining / 60);
        const rm = remaining % 60;
        setInfo({
          isOpen: true,
          label: 'WINDOW OPEN',
          sub: `Closes in ${rh}h ${rm}m · 9:30pm`,
        });
      } else if (mins < openAt) {
        const remaining = openAt - mins;
        const rh = Math.floor(remaining / 60);
        const rm = remaining % 60;
        setInfo({
          isOpen: false,
          label: `${rh}h ${rm}m`,
          sub: 'until eating window opens · 3:30pm',
        });
      } else {
        // Past 9:30pm
        const remaining = nextOpenAt - mins;
        const rh = Math.floor(remaining / 60);
        const rm = remaining % 60;
        setInfo({
          isOpen: false,
          label: `${rh}h ${rm}m`,
          sub: 'until window opens tomorrow · 3:30pm',
        });
      }
    };

    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  return info;
}

// ─── Quick-add foods ───────────────────────────────────────────────────────────
const QUICK_FOODS = [
  { label: 'Icelandic Skyr', emoji: '🥛', protein: 17, carbs: 8, fats: 0, cal: 100 },
  { label: 'Levels Protein (1 scoop)', emoji: '💪', protein: 25, carbs: 3, fats: 2, cal: 130 },
  { label: 'Egg (1)', emoji: '🥚', protein: 6, carbs: 0, fats: 5, cal: 70 },
  { label: 'Ground Beef 80/20 (3oz)', emoji: '🥩', protein: 17, carbs: 0, fats: 18, cal: 228 },
  { label: 'Chicken Thigh (3oz)', emoji: '🍗', protein: 21, carbs: 0, fats: 9, cal: 170 },
  { label: 'Raw Milk (1 cup)', emoji: '🥛', protein: 8, carbs: 12, fats: 8, cal: 150 },
  { label: 'Bacon (2 strips)', emoji: '🥓', protein: 6, carbs: 0, fats: 6, cal: 80 },
  { label: 'Butter (1 tbsp)', emoji: '🧈', protein: 0, carbs: 0, fats: 12, cal: 102 },
  { label: 'Sweet Potato (medium)', emoji: '🍠', protein: 2, carbs: 26, fats: 0, cal: 103 },
  { label: 'White Rice (1 cup)', emoji: '🍚', protein: 4, carbs: 44, fats: 0, cal: 200 },
  { label: 'Banana', emoji: '🍌', protein: 1, carbs: 27, fats: 0, cal: 105 },
  { label: 'Sourdough (1 slice)', emoji: '🍞', protein: 4, carbs: 15, fats: 1, cal: 79 },
] as const;

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function FuelPage() {
  const { todayEntry, add, update } = useNutrition();
  const fasting = useFastingTimer();

  const [protein, setProtein] = useState(todayEntry?.protein ?? 0);
  const [carbs, setCarbs] = useState(todayEntry?.carbs ?? 0);
  const [fats, setFats] = useState(todayEntry?.fats ?? 0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (todayEntry) {
      setProtein(todayEntry.protein);
      setCarbs(todayEntry.carbs);
      setFats(todayEntry.fats);
    }
  }, [todayEntry?.id]);

  const calories = autoCalories(protein, carbs, fats);
  const proteinPct = Math.min(100, (protein / PROTEIN_TARGET) * 100);
  const proteinHit = protein >= PROTEIN_TARGET;

  const addFood = (food: typeof QUICK_FOODS[number]) => {
    const newP = protein + food.protein;
    const newC = carbs + food.carbs;
    const newF = fats + food.fats;
    setProtein(newP);
    setCarbs(newC);
    setFats(newF);
    setSaved(false);

    // Auto-save
    const entry: NutritionEntry = {
      id: todayEntry?.id || crypto.randomUUID(),
      date: today(),
      protein: newP,
      carbs: newC,
      fats: newF,
      calories: autoCalories(newP, newC, newF),
      fiber: todayEntry?.fiber ?? null,
      water: todayEntry?.water ?? null,
      notes: todayEntry?.notes ?? '',
      createdAt: todayEntry?.createdAt || new Date().toISOString(),
    };
    if (todayEntry) update(todayEntry.id, entry);
    else add(entry);
  };

  const saveManual = () => {
    const entry: NutritionEntry = {
      id: todayEntry?.id || crypto.randomUUID(),
      date: today(),
      protein,
      carbs,
      fats,
      calories,
      fiber: todayEntry?.fiber ?? null,
      water: todayEntry?.water ?? null,
      notes: todayEntry?.notes ?? '',
      createdAt: todayEntry?.createdAt || new Date().toISOString(),
    };
    if (todayEntry) update(todayEntry.id, entry);
    else add(entry);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  // Check if anchor (Icelandic + 2 Levels) was likely hit
  const anchorHit = protein >= 60;

  return (
    <div>
      <PageHeader title="Fuel" />
      <div className="px-4 py-4 space-y-4">

        {/* Fasting Timer */}
        <div
          className="rounded-2xl p-5 text-center"
          style={{
            background: fasting.isOpen ? 'rgba(74,124,89,0.15)' : '#1a1a1a',
            border: `2px solid ${fasting.isOpen ? '#4a7c59' : '#2a2a2a'}`,
          }}
        >
          <p className="text-xs text-muted uppercase tracking-widest mb-1">Fasting Protocol</p>
          <p
            className="font-display font-bold leading-none"
            style={{
              fontSize: fasting.isOpen ? '28px' : '48px',
              color: fasting.isOpen ? '#4a7c59' : '#c9963a',
            }}
          >
            {fasting.label}
          </p>
          <p className="text-xs text-muted mt-1">{fasting.sub}</p>
        </div>

        {/* Protein Progress (dominant) */}
        <div className="rounded-xl p-5" style={{ background: '#1a1a1a', border: '1px solid rgba(201,150,58,0.25)' }}>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">Protein</p>
              <p className="font-display font-bold leading-none" style={{ fontSize: '40px', color: proteinHit ? '#4a7c59' : '#c9963a' }}>
                {protein}
                <span className="text-xl text-muted font-sans">/{PROTEIN_TARGET}g</span>
              </p>
            </div>
            {proteinHit && <span className="text-2xl">✓</span>}
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: '#2a2a2a' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${proteinPct}%`,
                background: proteinHit ? '#4a7c59' : '#c9963a',
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted">
            <span>0g</span>
            <span>{PROTEIN_TARGET}g target</span>
          </div>
        </div>

        {/* Quick-add foods */}
        <div>
          <h3 className="font-display font-bold text-xs tracking-widest text-muted uppercase mb-2">Quick Add</h3>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_FOODS.map(food => (
              <button
                key={food.label}
                onClick={() => addFood(food)}
                className="rounded-xl p-3 text-left active:scale-[0.98] transition-transform"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
              >
                <p className="text-base mb-1">{food.emoji}</p>
                <p className="text-xs font-medium leading-tight" style={{ color: '#f0ece4' }}>{food.label}</p>
                <p className="text-[10px] text-muted mt-0.5 font-number">
                  P{food.protein} · {food.cal}cal
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Manual edit */}
        <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <h3 className="font-display font-bold text-xs tracking-widest text-muted uppercase mb-3">Manual Entry</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Protein', value: protein, set: setProtein, target: `${MACRO_TARGETS.protein.min}-${MACRO_TARGETS.protein.max}g` },
              { label: 'Carbs', value: carbs, set: setCarbs, target: `${MACRO_TARGETS.carbs.min}-${MACRO_TARGETS.carbs.max}g` },
              { label: 'Fats', value: fats, set: setFats, target: `${MACRO_TARGETS.fats.min}-${MACRO_TARGETS.fats.max}g` },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[10px] text-muted">{f.label}</label>
                <input
                  type="number"
                  value={f.value || ''}
                  onChange={e => f.set(Number(e.target.value) || 0)}
                  inputMode="numeric"
                  className="w-full rounded-lg px-2 py-2 text-sm font-number text-center outline-none mt-0.5"
                  style={{ background: '#2a2a2a', color: '#f0ece4' }}
                />
                <p className="text-[9px] text-muted text-center mt-0.5">{f.target}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm border-t pt-3" style={{ borderColor: '#2a2a2a' }}>
            <div>
              <span className="text-muted">Calories </span>
              <span className="font-number font-bold" style={{ color: '#f0ece4' }}>{calories}</span>
              <span className="text-muted text-xs"> / {CALORIE_RANGE.min}–{CALORIE_RANGE.max}</span>
            </div>
            <button
              onClick={saveManual}
              className="px-4 py-2 rounded-xl font-display font-bold text-sm tracking-wide text-black"
              style={{ background: saved ? '#4a7c59' : '#c9963a', color: saved ? '#fff' : '#000' }}
            >
              {saved ? 'SAVED ✓' : 'SAVE'}
            </button>
          </div>
        </div>

        {/* Evening Anchor Checklist */}
        <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <h3 className="font-display font-bold text-xs tracking-widest text-muted uppercase mb-3">Evening Anchor</h3>
          <div className="space-y-2">
            {[
              { label: 'Icelandic Provisions skyr', done: protein >= 17 },
              { label: '2 scoops Levels Protein', done: protein >= 50 },
              { label: `Hit ${PROTEIN_TARGET}g protein target`, done: proteinHit },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: item.done ? '#4a7c59' : '#2a2a2a' }}
                >
                  {item.done && <span className="text-white text-xs">✓</span>}
                </div>
                <span className={`text-sm ${item.done ? 'line-through text-muted' : ''}`}
                  style={{ color: item.done ? '#4a4845' : '#f0ece4' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          {anchorHit && (
            <p className="text-xs mt-3 text-center" style={{ color: '#4a7c59' }}>
              Anchor complete. Close the day right.
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <h3 className="font-display font-bold text-xs tracking-widest text-muted uppercase mb-3">Today's Summary</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Protein', value: `${protein}g`, pct: proteinPct },
              { label: 'Carbs', value: `${carbs}g`, pct: Math.min(100, (carbs / MACRO_TARGETS.carbs.max) * 100) },
              { label: 'Fats', value: `${fats}g`, pct: Math.min(100, (fats / MACRO_TARGETS.fats.max) * 100) },
              { label: 'Cal', value: `${calories}`, pct: Math.min(100, (calories / CALORIE_RANGE.max) * 100) },
            ].map(s => (
              <div key={s.label}>
                <p className="text-[10px] text-muted mb-1">{s.label}</p>
                <p className="font-number text-sm font-bold" style={{ color: '#f0ece4' }}>{s.value}</p>
                <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: '#2a2a2a' }}>
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: '#c9963a' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
