import { differenceInDays, differenceInCalendarWeeks, parseISO, format, startOfWeek, endOfWeek, addWeeks, isWithinInterval } from 'date-fns';
import { PROGRAM_START, PROGRAM_END } from '../constants/baseline';
import type { DateString } from '../types';

export function today(): DateString {
  return format(new Date(), 'yyyy-MM-dd');
}

export function toDateString(date: Date): DateString {
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplay(date: DateString): string {
  return format(parseISO(date), 'MMM d, yyyy');
}

export function formatShort(date: DateString): string {
  return format(parseISO(date), 'MMM d');
}

export function getDaysRemaining(): number {
  return Math.max(0, differenceInDays(parseISO(PROGRAM_END), new Date()));
}

export function getWeeksRemaining(): number {
  const days = getDaysRemaining();
  return Math.max(0, Math.ceil(days / 7));
}

export function getCurrentWeek(): number {
  const weeks = differenceInCalendarWeeks(new Date(), parseISO(PROGRAM_START), { weekStartsOn: 1 });
  return Math.max(1, Math.min(12, weeks + 1));
}

export function getWeekRange(weekNumber: number): { start: DateString; end: DateString } {
  const programStart = parseISO(PROGRAM_START);
  const weekStart = addWeeks(startOfWeek(programStart, { weekStartsOn: 1 }), weekNumber - 1);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  return {
    start: toDateString(weekStart),
    end: toDateString(weekEnd),
  };
}

export function isInProgram(date: DateString): boolean {
  return isWithinInterval(parseISO(date), {
    start: parseISO(PROGRAM_START),
    end: parseISO(PROGRAM_END),
  });
}

export function getProgressPercent(): number {
  const totalDays = differenceInDays(parseISO(PROGRAM_END), parseISO(PROGRAM_START));
  const elapsed = differenceInDays(new Date(), parseISO(PROGRAM_START));
  return Math.max(0, Math.min(100, (elapsed / totalDays) * 100));
}
