import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBodyComp } from '../hooks/useBodyComp';
import { useProjections } from '../hooks/useProjections';
import { PageHeader } from '../components/layout/PageHeader';
import { WeightTrendChart } from '../components/charts/WeightTrendChart';
import { TARGETS } from '../constants/baseline';
import { resolveBaseline, resolvePeak } from '../utils/baseline';
import type { BodyCompEntry } from '../types';
import { today, formatDisplay } from '../utils/date-helpers';
import { Trash2, ChevronDown, ChevronUp, Info } from 'lucide-react';

function StatCard({
  label, value, unit, sub, color,
}: {
  label: string; value: string; unit: string; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-xl p-3" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
      <p className="text-[10px] text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className="font-number font-bold text-xl leading-none" style={{ color: color || '#f0ece4' }}>
        {value}<span className="text-xs text-muted font-sans ml-0.5">{unit}</span>
      </p>
      {sub && <p className="text-[10px] text-muted mt-1">{sub}</p>}
    </div>
  );
}

export function BodyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { entries, add, update, remove, latest } = useBodyComp();
  const projections = useProjections(entries);
  const baseline = resolveBaseline(entries);
  const peak = resolvePeak(entries);
  const formRef = useRef<HTMLDivElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingBaseline, setEditingBaseline] = useState(false);
  const [weight, setWeight] = useState('');
  const [smm, setSmm] = useState('');
  const [bf, setBf] = useState('');
  const [ecw, setEcw] = useState('');
  const [scanDate, setScanDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [showEcwInfo, setShowEcwInfo] = useState(false);

  const fatLost = latest ? +(baseline.weight - latest.weight).toFixed(1) : null;
  const muscleDelta = latest?.muscleMass ? +(latest.muscleMass - baseline.muscleMass).toFixed(1) : null;
  const ecwColor = (latest?.ecwRatio ?? 0) >= TARGETS.ecwRatioWarning ? '#8b3a3a' : '#4a7c59';

  const openBaselineEdit = () => {
    const existing = entries.find(e => e.id === 'baseline');
    setEditingBaseline(true);
    setShowForm(true);
    setWeight(String(baseline.weight));
    setSmm(String(baseline.muscleMass));
    setBf(String(baseline.bodyFatPercent));
    setEcw(String(baseline.ecwRatio));
    setScanDate(existing?.date ?? baseline.date);
    setNotes(baseline.label);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  useEffect(() => {
    if (searchParams.get('editBaseline') === '1') {
      openBaselineEdit();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once from deep link
  }, [searchParams]);

  const openNewScan = () => {
    if (showForm && !editingBaseline) {
      setShowForm(false);
      return;
    }
    setEditingBaseline(false);
    setShowForm(true);
    setWeight(''); setSmm(''); setBf(''); setEcw(''); setNotes('');
    setScanDate(today());
  };

  const handleSave = () => {
    const w = parseFloat(weight);
    if (isNaN(w)) return;

    if (editingBaseline) {
      const existing = entries.find(e => e.id === 'baseline');
      const entry: BodyCompEntry = {
        id: 'baseline',
        date: scanDate || existing?.date || today(),
        weight: w,
        muscleMass: smm ? parseFloat(smm) : null,
        bodyFatPercent: bf ? parseFloat(bf) : null,
        ecwRatio: ecw ? parseFloat(ecw) : null,
        notes: notes || 'Start baseline',
        source: 'inbody',
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      if (existing) update('baseline', entry);
      else add(entry);
    } else {
      const entry: BodyCompEntry = {
        id: crypto.randomUUID(),
        date: scanDate || today(),
        weight: w,
        muscleMass: smm ? parseFloat(smm) : null,
        bodyFatPercent: bf ? parseFloat(bf) : null,
        ecwRatio: ecw ? parseFloat(ecw) : null,
        notes,
        source: 'inbody',
        createdAt: new Date().toISOString(),
      };
      add(entry);
    }

    setSaved(true);
    setWeight(''); setSmm(''); setBf(''); setEcw(''); setNotes('');
    setTimeout(() => {
      setSaved(false);
      setShowForm(false);
      setEditingBaseline(false);
    }, 1200);
  };

  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <PageHeader title="Body" />
      <div className="px-4 py-4 space-y-4">

        {/* Scans overview */}
        <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid rgba(201,150,58,0.25)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-xs tracking-widest text-muted uppercase">90-Day Progress</h2>
            <p className="text-xs text-muted">Goal: May 12</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: '#222', border: '1px solid #333' }}>
              <p className="text-[10px] text-muted mb-1">{baseline.label}</p>
              <p className="text-xs font-medium" style={{ color: '#f0ece4' }}>{baseline.weight} lbs · {baseline.bodyFatPercent}% BF</p>
              <p className="text-[10px] text-muted mb-2">SMM {baseline.muscleMass} lbs</p>
              <button
                type="button"
                onClick={openBaselineEdit}
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: '#c9963a' }}
              >
                Edit Start →
              </button>
            </div>
            <div className="rounded-xl p-3" style={{ background: '#222', border: '1px solid rgba(201,150,58,0.3)' }}>
              <p className="text-[10px]" style={{ color: '#c9963a' }}>Goal</p>
              <p className="text-xs font-medium" style={{ color: '#f0ece4' }}>{TARGETS.weight} lbs · {TARGETS.bodyFatPercent}% BF</p>
              <p className="text-[10px] text-muted">SMM ≥{TARGETS.muscleMass} lbs</p>
            </div>
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="Fat Lost"
            value={fatLost !== null ? (fatLost > 0 ? `-${fatLost}` : `+${Math.abs(fatLost)}`) : '--'}
            unit="lbs"
            sub={`since ${formatDisplay(baseline.date)}`}
            color={fatLost && fatLost > 0 ? '#4a7c59' : '#c9963a'}
          />
          <StatCard
            label="Muscle"
            value={latest?.muscleMass?.toFixed(1) ?? '--'}
            unit="lbs"
            sub={muscleDelta !== null ? `${muscleDelta >= 0 ? '+' : ''}${muscleDelta} from baseline` : 'baseline'}
            color={muscleDelta !== null && muscleDelta >= 0 ? '#4a7c59' : '#8b3a3a'}
          />
          <StatCard
            label="Est. BF%"
            value={latest?.bodyFatPercent?.toFixed(1) ?? '--'}
            unit="%"
            sub={`Goal: ${TARGETS.bodyFatPercent}%`}
            color={latest?.bodyFatPercent && latest.bodyFatPercent <= TARGETS.bodyFatPercent ? '#4a7c59' : '#c9963a'}
          />
          <div className="relative">
            <StatCard
              label="ECW/TBW"
              value={latest?.ecwRatio?.toFixed(3) ?? '--'}
              unit=""
              sub="Goal: ≤0.358"
              color={ecwColor}
            />
            <button
              onClick={() => setShowEcwInfo(s => !s)}
              className="absolute top-2 right-2 text-muted"
            >
              <Info size={14} />
            </button>
          </div>
        </div>

        {/* ECW Info */}
        {showEcwInfo && (
          <div className="rounded-xl p-4 text-sm" style={{ background: '#1a2020', border: '1px solid #2a3a3a' }}>
            <p className="font-medium mb-2" style={{ color: '#f0ece4' }}>What is ECW/TBW?</p>
            <p className="text-muted text-sm leading-relaxed">
              This measures cellular hydration and inflammation. Your current{' '}
              <span className="font-number">{latest?.ecwRatio?.toFixed(3) ?? '0.368'}</span> is slightly elevated —
              this improves with consistent sleep, reduced stress, and proper hydration. It's a hidden fat loss factor.
              Your goal is ≤{TARGETS.ecwRatio}.
            </p>
          </div>
        )}

        {/* Weight trend chart */}
        {entries.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-xs tracking-widest text-muted uppercase">Weight Trend</h3>
              {projections.projectedWeight && (
                <p className="text-xs text-muted">
                  → {projections.projectedWeight.toFixed(1)} lbs by May 12
                </p>
              )}
            </div>
            <WeightTrendChart entries={entries} />
          </div>
        )}

        {/* Historical context */}
        <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <h3 className="font-display font-bold text-xs tracking-widest text-muted uppercase mb-3">Historical Context</h3>
          <div className="flex gap-4 text-sm">
            <div>
              <p className="text-[10px] text-muted">Aug 2025 Peak</p>
              <p className="font-number font-bold" style={{ color: '#c9963a' }}>{peak.weight} lbs</p>
              <p className="text-[10px] text-muted">{peak.bodyFatPercent}% BF · SMM {peak.muscleMass}</p>
            </div>
            <div className="w-px" style={{ background: '#2a2a2a' }} />
            <div>
              <p className="text-[10px] text-muted">Now vs. Peak</p>
              <p className="font-number font-bold" style={{ color: '#f0ece4' }}>
                {latest ? `${latest.weight - peak.weight >= 0 ? '+' : ''}${(latest.weight - peak.weight).toFixed(1)}` : '--'} lbs
              </p>
              <p className="text-[10px] text-muted">
                {latest?.muscleMass
                  ? `${latest.muscleMass - peak.muscleMass >= 0 ? '+' : ''}${(latest.muscleMass - peak.muscleMass).toFixed(1)} lbs muscle`
                  : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Add scan */}
        <button
          type="button"
          onClick={openNewScan}
          className="w-full py-3 rounded-xl font-display font-bold text-sm tracking-wide flex items-center justify-center gap-2"
          style={{ background: '#1a1a1a', border: '1px dashed rgba(201,150,58,0.4)', color: '#c9963a' }}
        >
          {showForm && !editingBaseline ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showForm && !editingBaseline ? 'CANCEL' : 'ADD NEW SCAN'}
        </button>

        {showForm && (
          <div
            ref={formRef}
            className="rounded-xl p-4 space-y-4"
            style={{ background: '#1a1a1a', border: '1px solid rgba(201,150,58,0.25)' }}
          >
            <h3 className="font-display font-bold text-sm tracking-wide" style={{ color: '#c9963a' }}>
              {editingBaseline ? 'EDIT START BASELINE' : 'NEW InBody SCAN'}
            </h3>
            <div>
              <label className="text-[10px] text-muted">Scan date</label>
              <input
                type="date"
                value={scanDate}
                onChange={e => setScanDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none mt-0.5"
                style={{ background: '#2a2a2a', color: '#f0ece4' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Weight (lbs) *', value: weight, set: setWeight, placeholder: '248.7' },
                { label: 'SMM (lbs)', value: smm, set: setSmm, placeholder: '114.4' },
                { label: 'Body Fat %', value: bf, set: setBf, placeholder: '20.5' },
                { label: 'ECW/TBW', value: ecw, set: setEcw, placeholder: '0.368' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[10px] text-muted">{f.label}</label>
                  <input
                    type="number"
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    inputMode="decimal"
                    step="any"
                    className="w-full rounded-lg px-3 py-2 text-sm font-number outline-none mt-0.5"
                    style={{ background: '#2a2a2a', color: '#f0ece4' }}
                  />
                </div>
              ))}
            </div>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes / context..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: '#2a2a2a', color: '#f0ece4' }}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!weight}
              className="w-full py-3 rounded-xl font-display font-bold text-sm tracking-wide text-black disabled:opacity-40 active:scale-[0.98] transition-all"
              style={{ background: saved ? '#4a7c59' : '#c9963a', color: saved ? '#fff' : '#000' }}
            >
              {saved ? '✓ SAVED' : editingBaseline ? 'SAVE BASELINE' : 'SAVE SCAN'}
            </button>
          </div>
        )}

        {/* History */}
        <div className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <h3 className="font-display font-bold text-xs tracking-widest text-muted uppercase mb-3">Scan History</h3>
          <div className="space-y-3">
            {sortedEntries.map(entry => (
              <div
                key={entry.id}
                className="flex items-start justify-between py-2 border-b border-muted/10 last:border-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium font-number" style={{ color: '#f0ece4' }}>
                      {entry.weight} lbs
                    </p>
                    {entry.id === 'baseline' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: 'rgba(201,150,58,0.2)', color: '#c9963a' }}>
                        Start
                      </span>
                    )}
                    {entry.id === 'peak-2025' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: 'rgba(74,124,89,0.2)', color: '#4a7c59' }}>
                        Peak
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    {formatDisplay(entry.date)}
                    {entry.bodyFatPercent && ` · ${entry.bodyFatPercent}% BF`}
                    {entry.muscleMass && ` · ${entry.muscleMass} lbs SMM`}
                  </p>
                  {entry.notes && <p className="text-xs text-muted italic mt-0.5">{entry.notes}</p>}
                </div>
                {entry.id !== 'baseline' && entry.id !== 'peak-2025' && (
                  <button onClick={() => remove(entry.id)} className="p-1.5 text-muted">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
