import { useBodyComp } from '../hooks/useBodyComp';
import { useProjections } from '../hooks/useProjections';
import { useCountdown } from '../hooks/useCountdown';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { StatBlock } from '../components/ui/StatBlock';
import { ProjectionChart } from '../components/charts/ProjectionChart';

export function ProjectionsPage() {
  const { entries, latest } = useBodyComp();
  const { projectedWeight, projectedBf, rate, pace } = useProjections(entries);
  const { weeksRemaining } = useCountdown();

  return (
    <div>
      <PageHeader title="Projections" />
      <div className="px-4 py-4 space-y-4">
        {/* Pace indicator */}
        <Card>
          <div className="text-center">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
              pace === 'ahead' ? 'bg-primary/20 text-primary' :
              pace === 'on-track' ? 'bg-success/20 text-success' :
              pace === 'behind' ? 'bg-warning/20 text-warning' : 'bg-surface-alt text-muted'
            }`}>
              {pace === 'ahead' ? 'Ahead of Schedule' :
               pace === 'on-track' ? 'On Track' :
               pace === 'behind' ? 'Behind Pace' : 'Not enough data'}
            </div>
            {projectedWeight && (
              <p className="text-2xl font-bold tabular-nums">{projectedWeight.toFixed(1)} lbs</p>
            )}
            <p className="text-xs text-muted">Projected end weight (May 9)</p>
          </div>
        </Card>

        {/* Stats */}
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <StatBlock label="Weekly Rate" value={rate?.toFixed(1) || '--'} unit="lbs/wk" />
            <StatBlock label="Weeks Left" value={weeksRemaining} />
            <StatBlock label="To Lose" value={latest ? (latest.weight - 220).toFixed(1) : '--'} unit="lbs" />
            <StatBlock label="Projected BF%" value={projectedBf?.toFixed(1) || '--'} unit="%" />
          </div>
        </Card>

        {/* Projection chart */}
        {entries.length > 1 && (
          <Card>
            <h3 className="text-sm font-medium mb-2">Weight Projection</h3>
            <ProjectionChart entries={entries} projectedWeight={projectedWeight} />
          </Card>
        )}

        {/* Week-by-week */}
        <Card>
          <h3 className="text-sm font-medium mb-3">Weekly Breakdown</h3>
          <div className="space-y-1">
            {entries.filter(e => e.id !== 'baseline' || true).map((entry, i) => {
              const prev = i > 0 ? entries[i - 1] : null;
              const weekDelta = prev ? entry.weight - prev.weight : 0;
              return (
                <div key={entry.id} className="flex items-center justify-between py-1.5 text-sm border-b border-white/5 last:border-0">
                  <span className="text-muted">{entry.date}</span>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums font-medium">{entry.weight} lbs</span>
                    {prev && (
                      <span className={`text-xs tabular-nums ${weekDelta < 0 ? 'text-success' : weekDelta > 0 ? 'text-danger' : 'text-muted'}`}>
                        {weekDelta > 0 ? '+' : ''}{weekDelta.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
