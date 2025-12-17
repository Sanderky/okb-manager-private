import { type LangCode } from './reportTranslations';
import type { ConstructionsWithWorkHours } from './useHoursTable';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import isoWeek from 'dayjs/plugin/isoWeek';
import { sortByLastName } from '../Employees/EmployeesHelpers';

dayjs.extend(isoWeek);
dayjs.locale('pl');

export const formatToPolishDecimal = (value: number) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return value;
  }

  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
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

export const sortConstructionsWithWorkHours = (
  data: ConstructionsWithWorkHours[]
): ConstructionsWithWorkHours[] => {
  if (!data || data.length === 0) return data;
  return data
    .map((construction) => ({
      ...construction,
      workHours: [...construction.workHours].sort((a, b) =>
        sortByLastName(a.employeeName, b.employeeName)
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};
