import { useMemo } from 'react';
import type { BodyCompEntry, DailyCheckIn, NutritionEntry, Alert } from '../types';
import { TARGETS } from '../constants/baseline';
import { weeklyRateOfChange, getLatestEntry, averageField } from '../utils/calculations';
import { today } from '../utils/date-helpers';

export function useAlerts(
  bodyComp: BodyCompEntry[],
  checkIns: DailyCheckIn[],
  nutrition: NutritionEntry[],
): Alert[] {
  return useMemo(() => {
    const alerts: Alert[] = [];
    const latest = getLatestEntry(bodyComp);

    // Muscle loss check
    if (bodyComp.length >= 2) {
      const sorted = [...bodyComp]
        .filter(e => e.muscleMass != null)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (sorted.length >= 2) {
        const prev = sorted[sorted.length - 2];
        const curr = sorted[sorted.length - 1];
        if (prev.muscleMass != null && curr.muscleMass != null) {
          const loss = prev.muscleMass - curr.muscleMass;
          if (loss > TARGETS.muscleLossAlertLbs) {
            alerts.push({
              id: 'muscle-loss',
              severity: 'critical',
              category: 'muscle-loss',
              title: 'Muscle Mass Drop',
              message: `Lost ${loss.toFixed(1)} lbs muscle since last measurement`,
              recommendation: 'Consider increasing protein intake or reducing deficit',
            });
          }
        }
      }
    }

    // ECW ratio check
    if (latest?.ecwRatio != null && latest.ecwRatio >= TARGETS.ecwRatioWarning) {
      alerts.push({
        id: 'ecw-high',
        severity: 'warning',
        category: 'overtraining',
        title: 'ECW Ratio Elevated',
        message: `ECW at ${latest.ecwRatio} (threshold: ${TARGETS.ecwRatioWarning})`,
        recommendation: 'Possible inflammation or overtraining. Consider a deload or rest day.',
      });
    }

    // Rate of loss checks
    const rate = weeklyRateOfChange(bodyComp);
    if (rate != null) {
      if (rate > TARGETS.maxWeeklyLossLbs) {
        alerts.push({
          id: 'too-fast',
          severity: 'warning',
          category: 'too-fast',
          title: 'Losing Too Fast',
          message: `${rate.toFixed(1)} lbs/week (max recommended: ${TARGETS.maxWeeklyLossLbs})`,
          recommendation: 'Increase calories by 100-200 to protect muscle mass',
        });
      }

      // Stall check - need at least 2 weeks of data
      if (bodyComp.length >= 3 && rate < TARGETS.minWeeklyLossLbs) {
        alerts.push({
          id: 'stall',
          severity: 'warning',
          category: 'stall',
          title: 'Weight Loss Stalling',
          message: `Only ${rate.toFixed(1)} lbs/week (target: ${TARGETS.minWeeklyLossLbs}+)`,
          recommendation: 'Consider reducing carbs by 20g or adding a cardio session',
        });
      }
    }

    // Recovery check - last 3 days
    const recentCheckIns = [...checkIns]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3);
    if (recentCheckIns.length >= 3) {
      const avgEnergy = averageField(recentCheckIns, 'energyLevel');
      const avgSoreness = averageField(recentCheckIns, 'soreness');
      if (avgEnergy != null && avgEnergy < 2.5) {
        alerts.push({
          id: 'low-energy',
          severity: 'warning',
          category: 'recovery',
          title: 'Energy Consistently Low',
          message: `Avg energy ${avgEnergy}/5 over last 3 days`,
          recommendation: 'Consider a refeed day or extra rest',
        });
      }
      if (avgSoreness != null && avgSoreness >= 4) {
        alerts.push({
          id: 'high-soreness',
          severity: 'warning',
          category: 'recovery',
          title: 'High Soreness',
          message: `Avg soreness ${avgSoreness}/5 over last 3 days`,
          recommendation: 'Consider lighter training volume or active recovery',
        });
      }
    }

    // Nutrition compliance - this week
    const now = today();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split('T')[0];
    const weekNutrition = nutrition.filter(n => n.date >= weekStr && n.date <= now);
    if (weekNutrition.length < 5 && weekNutrition.length > 0) {
      alerts.push({
        id: 'low-compliance',
        severity: 'info',
        category: 'compliance',
        title: 'Log Your Nutrition',
        message: `Only ${weekNutrition.length}/7 days logged this week`,
        recommendation: 'Consistent logging helps the coach give better advice',
      });
    }

    return alerts;
  }, [bodyComp, checkIns, nutrition]);
}
