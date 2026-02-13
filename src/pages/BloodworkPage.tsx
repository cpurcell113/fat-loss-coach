import { useState } from 'react';
import { useBloodwork } from '../hooks/useBloodwork';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { LAB_OPTIMAL_RANGES, LAB_MARKER_NAMES } from '../constants/bloodwork';
import type { LabResult, LabMarker } from '../types';
import { today, formatDisplay } from '../utils/date-helpers';
import { Plus, Trash2 } from 'lucide-react';

export function BloodworkPage() {
  const { results, add } = useBloodwork();

  const [labName, setLabName] = useState('');
  const [markers, setMarkers] = useState<LabMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState(LAB_MARKER_NAMES[0]);
  const [markerValue, setMarkerValue] = useState('');
  const [saved, setSaved] = useState(false);

  const addMarker = () => {
    if (!markerValue) return;
    const range = LAB_OPTIMAL_RANGES[selectedMarker];
    setMarkers(prev => [...prev, {
      name: selectedMarker,
      value: Number(markerValue),
      unit: range.unit,
      referenceMin: range.refMin,
      referenceMax: range.refMax,
      optimalMin: range.optMin,
      optimalMax: range.optMax,
    }]);
    setMarkerValue('');
  };

  const handleSave = () => {
    if (markers.length === 0) return;
    const result: LabResult = {
      id: crypto.randomUUID(),
      date: today(),
      markers,
      labName: labName || 'Lab',
      notes: '',
      createdAt: new Date().toISOString(),
    };
    add(result);
    setMarkers([]);
    setLabName('');
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const getStatus = (marker: LabMarker): 'optimal' | 'reference' | 'out' => {
    if (marker.optimalMin != null && marker.optimalMax != null) {
      if (marker.value >= marker.optimalMin && marker.value <= marker.optimalMax) return 'optimal';
    }
    if (marker.referenceMin != null && marker.referenceMax != null) {
      if (marker.value >= marker.referenceMin && marker.value <= marker.referenceMax) return 'reference';
    }
    return 'out';
  };

  const statusColor = { optimal: 'text-success', reference: 'text-warning', out: 'text-danger' };

  return (
    <div>
      <PageHeader title="Bloodwork" />
      <div className="px-4 py-4 space-y-4">
        <Card>
          <h3 className="text-sm font-medium mb-3">Add Lab Results</h3>
          <input
            value={labName}
            onChange={e => setLabName(e.target.value)}
            placeholder="Lab name (e.g. Quest, LabCorp)"
            className="w-full bg-surface-alt rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 mb-3"
          />

          <div className="flex gap-2 mb-3">
            <select
              value={selectedMarker}
              onChange={e => setSelectedMarker(e.target.value)}
              className="flex-1 bg-surface-alt rounded-lg px-3 py-2.5 text-sm outline-none"
            >
              {LAB_MARKER_NAMES.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <input
              type="number"
              value={markerValue}
              onChange={e => setMarkerValue(e.target.value)}
              placeholder="Value"
              className="w-24 bg-surface-alt rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              inputMode="decimal"
            />
            <button
              onClick={addMarker}
              disabled={!markerValue}
              className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center disabled:opacity-40"
            >
              <Plus size={18} />
            </button>
          </div>

          {markers.length > 0 && (
            <div className="space-y-1 mb-3">
              {markers.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                  <span>{m.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${statusColor[getStatus(m)]}`}>
                      {m.value} {m.unit}
                    </span>
                    <button onClick={() => setMarkers(prev => prev.filter((_, j) => j !== i))} className="text-muted">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={markers.length === 0}
            className={`w-full py-3 rounded-xl font-semibold active:scale-[0.98] transition-all disabled:opacity-40 ${
              saved ? 'bg-success' : 'bg-primary'
            }`}
          >
            {saved ? '✓ Saved!' : 'Save Lab Results'}
          </button>
        </Card>

        {/* Previous results */}
        {results.length > 0 && (
          <Card>
            <h3 className="text-sm font-medium mb-3">Lab History</h3>
            {[...results].reverse().map(result => (
              <div key={result.id} className="mb-4 last:mb-0">
                <p className="text-xs text-muted mb-1">{formatDisplay(result.date)} · {result.labName}</p>
                <div className="space-y-1">
                  {result.markers.map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted">{m.name}</span>
                      <span className={`font-medium ${statusColor[getStatus(m)]}`}>
                        {m.value} {m.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
