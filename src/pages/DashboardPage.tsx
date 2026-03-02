import { useNavigate } from 'react-router-dom';
import { useBodyComp } from '../hooks/useBodyComp';
import { useNutrition } from '../hooks/useNutrition';
import { useCheckIn } from '../hooks/useCheckIn';
import { useCountdown } from '../hooks/useCountdown';
import { useProjections } from '../hooks/useProjections';
import { useAlerts } from '../hooks/useAlerts';
import { BASELINE } from '../constants/baseline';
import { Card } from '../components/ui/Card';
import { StatBlock } from '../components/ui/StatBlock';
import { AlertBanner } from '../components/ui/AlertBanner';
import { WeightTrendChart } from '../components/charts/WeightTrendChart';
import { CheckCircle2, Circle, Activity, TestTube2, TrendingUp, Download } from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();
  const { currentWeek, totalWeeks, daysRemaining, progressPercent } = useCountdown();
  const { entries: bodyComp, latest } = useBodyComp();
  const { todayEntry: todayNutrition } = useNutrition();
  const { todayEntry: todayCheckIn, entries: checkIns } = useCheckIn();
  const { entries: nutrition } = useNutrition();
  const projections = useProjections(bodyComp);
  const alerts = useAlerts(bodyComp, checkIns, nutrition);

  const weightDelta = latest ? latest.weight - BASELINE.weight : null;
  const bfDelta = latest?.bodyFatPercent ? latest.bodyFatPercent - BASELINE.bodyFatPercent : null;
  const muscleDelta = latest?.muscleMass ? latest.muscleMass - BASELINE.muscleMass : null;

  return (
    <div className="px-4 py-4 space-y-3">
      {/* Countdown */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Week {currentWeek} of {totalWeeks}</span>
          <span className="text-sm text-muted">{daysRemaining} days left</span>
        </div>
        <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {projections.pace && (
          <p className={`text-xs mt-2 ${
            projections.pace === 'on-track' ? 'text-success' :
            projections.pace === 'ahead' ? 'text-gold' : 'text-warning'
          }`}>
            {projections.pace === 'ahead' && 'Ahead of schedule'}
            {projections.pace === 'on-track' && 'On track'}
            {projections.pace === 'behind' && 'Behind pace - adjustments needed'}
            {projections.projectedWeight && ` — projected ${projections.projectedWeight.toFixed(1)} lbs by May 9`}
          </p>
        )}
      </Card>

      {/* Alerts */}
      {alerts.slice(0, 2).map(alert => (
        <AlertBanner key={alert.id} alert={alert} />
      ))}

      {/* Current Stats */}
      <Card>
        <div className="grid grid-cols-3 gap-4">
          <StatBlock
            label="Weight"
            value={latest?.weight.toFixed(1) || '--'}
            unit="lbs"
            delta={weightDelta}
            deltaGoodDirection="down"
          />
          <StatBlock
            label="Body Fat"
            value={latest?.bodyFatPercent?.toFixed(1) || '--'}
            unit="%"
            delta={bfDelta}
            deltaGoodDirection="down"
          />
          <StatBlock
            label="Muscle"
            value={latest?.muscleMass?.toFixed(1) || '--'}
            unit="lbs"
            delta={muscleDelta}
            deltaGoodDirection="up"
          />
        </div>
        {projections.rate != null && (
          <p className="text-xs text-muted mt-3">
            Losing {projections.rate.toFixed(1)} lbs/week
          </p>
        )}
      </Card>

      {/* Weight Trend */}
      {bodyComp.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium mb-2">Weight Trend</h3>
          <WeightTrendChart entries={bodyComp} />
        </Card>
      )}

      {/* Today's Status */}
      <Card>
        <h3 className="text-sm font-medium mb-3">Today</h3>
        <div className="space-y-2">
          <button
            onClick={() => !todayCheckIn && navigate('/log/check-in')}
            className="flex items-center gap-3 w-full text-left"
          >
            {todayCheckIn
              ? <CheckCircle2 size={18} className="text-success" />
              : <Circle size={18} className="text-muted" />
            }
            <span className={`text-sm ${todayCheckIn ? 'text-muted line-through' : ''}`}>
              {todayCheckIn ? 'Check-in done' : 'Do your check-in'}
            </span>
          </button>
          <button
            onClick={() => !todayNutrition && navigate('/log/nutrition')}
            className="flex items-center gap-3 w-full text-left"
          >
            {todayNutrition
              ? <CheckCircle2 size={18} className="text-success" />
              : <Circle size={18} className="text-muted" />
            }
            <span className={`text-sm ${todayNutrition ? 'text-muted' : ''}`}>
              {todayNutrition
                ? `Macros: P${todayNutrition.protein}g C${todayNutrition.carbs}g F${todayNutrition.fats}g`
                : 'Log your macros'
              }
            </span>
          </button>
        </div>
      </Card>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 gap-3">
        <Card onClick={() => navigate('/log/performance')} className="flex items-center gap-3">
          <Activity size={20} className="text-gold" />
          <span className="text-sm">Performance</span>
        </Card>
        <Card onClick={() => navigate('/log/bloodwork')} className="flex items-center gap-3">
          <TestTube2 size={20} className="text-gold" />
          <span className="text-sm">Bloodwork</span>
        </Card>
        <Card onClick={() => navigate('/projections')} className="flex items-center gap-3">
          <TrendingUp size={20} className="text-gold" />
          <span className="text-sm">Projections</span>
        </Card>
        <Card onClick={() => navigate('/settings')} className="flex items-center gap-3">
          <Download size={20} className="text-gold" />
          <span className="text-sm">Export</span>
        </Card>
      </div>
    </div>
  );
}
