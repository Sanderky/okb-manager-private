import dayjs, { Dayjs } from 'dayjs';
import type { LangCode } from '../model/types';

export const toSqlDate = (
  date?: Date | string | Dayjs | null
): string | null => {
  if (!date) return null;
  return dayjs(date).format('YYYY-MM-DD');
};

export function formatDate(date: Date): string {
  return dayjs(date).format('DD.MM.YYYY');
}

export const getWeekNumber = (date: Date) => dayjs(date).isoWeek()

export const getThreeMonthKeys = (week: Date): string[] => {
  const current = dayjs(week);
  return [
    current.subtract(1, 'month').format('YYYY-MM'),
    current.format('YYYY-MM'),
    current.add(1, 'month').format('YYYY-MM'),
  ];
};

export const getMonthKeysFromWeek = (startOfWeek: Date): string[] => {
  const start = dayjs(startOfWeek);
  const end = start.add(6, 'day');

  const keys = new Set<string>();
  keys.add(start.format('YYYY-MM'));
  keys.add(end.format('YYYY-MM'));

  return Array.from(keys);
};

export const getWeekDates = (week: Date): Date[] => {
  const start = dayjs(week).startOf('week');
  return Array.from({ length: 7 }).map((_, i) => start.add(i, 'day').toDate());
};

export function getStartOfWeek(date: Date): Date {
  return dayjs(date).startOf('week').toDate();
}

export function getEndOfWeek(date: Date): Date {
  return dayjs(date).endOf('week').toDate();
}

export function getPreviousWeek(date: Date): Date {
  return dayjs(date).subtract(1, 'week').startOf('week').toDate();
}

export function getNextWeek(date: Date): Date {
  return dayjs(date).add(1, 'week').startOf('week').toDate();
}

export function getWeeksInRange(startDate: Date, endDate: Date): Date[] {
  const weeks: Date[] = [];
  let current = dayjs(startDate).startOf('week');
  const end = dayjs(endDate).startOf('week');

  while (current.isSameOrBefore(end)) {
    weeks.push(current.toDate());
    current = current.add(1, 'week');
  }

  return weeks;
}

export const formatRange = (start: dayjs.Dayjs, end: dayjs.Dayjs) => {
  const sameDay = start.isSame(end, 'day');
  const sameMonth = start.month() === end.month();
  if (sameDay) return start.format('DD.MM');
  if (sameMonth) return `${start.format('DD')}-${end.format('DD.MM')}`;
  return `${start.format('DD.MM')}-${end.format('DD.MM')}`;
};

export const daysToRanges = (days: dayjs.Dayjs[]) => {
  if (days.length === 0) return [];
  const sorted = [...days].sort((a, b) => a.valueOf() - b.valueOf());
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].diff(end, 'day') === 1) {
      end = sorted[i];
    } else {
      ranges.push(formatRange(start, end));
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(formatRange(start, end));
  return ranges;
};

export const formatWeeksString = (
  weeksCount: number,
  lang: LangCode = 'pl-PL'
) => {
  if (lang === 'de-DE') {
    return weeksCount === 1 ? 'Woche' : 'Wochen';
  }

  if (lang === 'pl-PL') {
    const lastDigit = weeksCount % 10;
    const lastTwoDigits = weeksCount % 100;

    if (weeksCount === 1) return 'tydzień';
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'tygodni';
    if (lastDigit >= 2 && lastDigit <= 4) return 'tygodnie';
    return 'tygodni';
  }

  return 'tygodni';
};
