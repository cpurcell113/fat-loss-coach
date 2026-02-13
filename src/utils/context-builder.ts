import type { BodyCompEntry, NutritionEntry, DailyCheckIn, SprintSession, Alert } from '../types';
import { BASELINE } from '../constants/baseline';
import { getCurrentWeek, getDaysRemaining, today } from './date-helpers';
import { weeklyRateOfChange, projectEndWeight, getLatestEntry, getEntriesForDate, averageField } from './calculations';

export function buildCoachContext(
  bodyComp: BodyCompEntry[],
  nutrition: NutritionEntry[],
  checkIns: DailyCheckIn[],
  sprints: SprintSession[],
  alerts: Alert[],
): string {
  const now = today();
  const week = getCurrentWeek();
  const daysLeft = getDaysRemaining();
  const latest = getLatestEntry(bodyComp);
  const rate = weeklyRateOfChange(bodyComp);
  const weeksLeft = Math.ceil(daysLeft / 7);

  let ctx = `CURRENT STATUS (${now}):\n`;
  ctx += `- Week ${week} of 12, ${daysLeft} days remaining\n`;

  if (latest) {
    ctx += `- Latest weight: ${latest.weight} lbs (started ${BASELINE.weight}, target 220)\n`;
    ctx += `- Weight change from baseline: ${(BASELINE.weight - latest.weight).toFixed(1)} lbs lost\n`;
    if (rate !== null) {
      ctx += `- Rate of loss: ${rate.toFixed(1)} lbs/week (last 3 weigh-ins)\n`;
      const projected = projectEndWeight(latest.weight, rate, weeksLeft);
      ctx += `- Projection: At current rate, hitting ${projected} lbs by May 9\n`;
    }
    if (latest.bodyFatPercent) ctx += `- Latest BF%: ${latest.bodyFatPercent}%\n`;
    if (latest.muscleMass) ctx += `- Latest muscle mass: ${latest.muscleMass} lbs (started ${BASELINE.muscleMass})\n`;
    if (latest.ecwRatio) ctx += `- Latest ECW ratio: ${latest.ecwRatio} (warning threshold: 0.390)\n`;
  }

  // Today's logging
  const todayNutrition = getEntriesForDate(nutrition, now);
  const todayCheckIn = getEntriesForDate(checkIns, now);
  const todaySprints = getEntriesForDate(sprints, now);

  ctx += `\nTODAY'S LOGGING:\n`;
  if (todayCheckIn.length > 0) {
    const ci = todayCheckIn[0];
    ctx += `- Check-in: Done (sleep ${ci.sleepHours}hrs quality ${ci.sleepQuality}/5, energy ${ci.energyLevel}/5, soreness ${ci.soreness}/5, mood ${ci.mood}/5)\n`;
    ctx += `  Training: ${ci.didResistance ? 'Resistance YES' : 'No resistance'}, ${ci.didCardio ? 'Cardio YES' : 'No cardio'}\n`;
  } else {
    ctx += `- Check-in: Not done yet\n`;
  }

  if (todayNutrition.length > 0) {
    const n = todayNutrition[0];
    ctx += `- Nutrition: Logged (P: ${n.protein}g, C: ${n.carbs}g, F: ${n.fats}g = ${n.calories} cal)\n`;
  } else {
    ctx += `- Nutrition: Not logged yet\n`;
  }

  if (todaySprints.length > 0) {
    ctx += `- Sprint session: ${todaySprints[0].rounds} rounds, RPE ${todaySprints[0].rpe}/10\n`;
  }

  // This week summary
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const weekNutrition = nutrition.filter(n => n.date >= weekStartStr && n.date <= now);
  const weekCheckIns = checkIns.filter(c => c.date >= weekStartStr && c.date <= now);

  if (weekNutrition.length > 0 || weekCheckIns.length > 0) {
    ctx += `\nTHIS WEEK SO FAR:\n`;
    ctx += `- Nutrition logged: ${weekNutrition.length} days\n`;
    if (weekNutrition.length > 0) {
      const avgP = averageField(weekNutrition, 'protein');
      const avgC = averageField(weekNutrition, 'carbs');
      const avgF = averageField(weekNutrition, 'fats');
      ctx += `- Avg macros: P ${avgP}g / C ${avgC}g / F ${avgF}g\n`;
    }
    if (weekCheckIns.length > 0) {
      const avgEnergy = averageField(weekCheckIns, 'energyLevel');
      const avgRecovery = averageField(weekCheckIns, 'soreness');
      ctx += `- Check-ins: ${weekCheckIns.length} days, avg energy ${avgEnergy}/5, avg soreness ${avgRecovery}/5\n`;
    }
  }

  // Alerts
  if (alerts.length > 0) {
    ctx += `\nACTIVE ALERTS:\n`;
    alerts.forEach(a => {
      ctx += `- [${a.severity.toUpperCase()}] ${a.title}: ${a.message}\n`;
    });
  }

  return ctx;
}
