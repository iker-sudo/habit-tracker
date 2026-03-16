import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addWeeks,
  subWeeks,
  isToday,
  isSameDay,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';

export function getWeekStart(date: Date): string {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return format(start, 'yyyy-MM-dd');
}

export function getWeekDays(weekStartStr: string): Date[] {
  const start = parseISO(weekStartStr);
  const end = endOfWeek(start, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getDayName(date: Date): string {
  return format(date, 'EEEE', { locale: es });
}

export function getDayShort(date: Date): string {
  return format(date, 'EEE', { locale: es });
}

export function getMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: es });
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getNextWeekStart(weekStartStr: string): string {
  return format(addWeeks(parseISO(weekStartStr), 1), 'yyyy-MM-dd');
}

export function getPrevWeekStart(weekStartStr: string): string {
  return format(subWeeks(parseISO(weekStartStr), 1), 'yyyy-MM-dd');
}

export function isDayToday(date: Date): boolean {
  return isToday(date);
}

export function isSameDate(a: Date, b: Date): boolean {
  return isSameDay(a, b);
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDayNumber(date: Date): string {
  return format(date, 'd');
}

/**
 * Returns day-of-week index where Monday=0, Sunday=6
 * (matches our RoutinePattern.dayOfWeek convention)
 */
export function getDayOfWeekIndex(date: Date): number {
  const jsDay = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  return jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Monday, 6=Sunday
}
