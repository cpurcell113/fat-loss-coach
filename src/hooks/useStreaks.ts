import { useMemo } from 'react';
import type { DailyCheckIn, NutritionEntry, SprintSession } from '../types';
import { PROTEIN_TARGET } from '../constants/baseline';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function weekStartStr(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  return d.toISOString().split('T')[0];
}

function calcConsecutiveStreak(dates: string[], fromDate: string): number {
  if (dates.length === 0) return 0;
  const unique = [...new Set(dates)].sort().reverse();
  let streak = 0;
  const check = new Date(fromDate + 'T12:00:00');

  for (const d of unique) {
    const checkStr = check.toISOString().split('T')[0];
    if (d === checkStr) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else if (d < checkStr) {
      break;
    }
  }
  return streak;
}

export function useStreaks(
  checkIns: DailyCheckIn[],
  nutrition: NutritionEntry[],
  sprints: SprintSession[],
) {
  return useMemo(() => {
    const now = todayStr();
    const wStart = weekStartStr(now);

    const morningStreak = calcConsecutiveStreak(
      checkIns.map(c => c.date),
      now,
    );

    const proteinStreak = calcConsecutiveStreak(
      nutrition.filter(n => n.protein >= PROTEIN_TARGET).map(n => n.date),
      now,
    );

    const sprintDaysThisWeek = new Set(
      sprints.filter(s => s.date >= wStart && s.date <= now).map(s => s.date),
    ).size;

    return { morningStreak, proteinStreak, sprintWeek: sprintDaysThisWeek };
  }, [checkIns, nutrition, sprints]);
}
