import { getCurrentWeek, getDaysRemaining, getWeeksRemaining, getProgressPercent } from '../utils/date-helpers';
import { TOTAL_WEEKS } from '../constants/baseline';

export function useCountdown() {
  return {
    currentWeek: getCurrentWeek(),
    totalWeeks: TOTAL_WEEKS,
    daysRemaining: getDaysRemaining(),
    weeksRemaining: getWeeksRemaining(),
    progressPercent: getProgressPercent(),
  };
}
