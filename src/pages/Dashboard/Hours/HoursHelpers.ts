import { type LangCode } from './reportTranslations';

export const getThreeMonthKeys = (week: Date): string[] => {
  const keys: string[] = [];

  for (let i = -1; i <= 1; i++) {
    const targetDate = new Date(week.getFullYear(), week.getMonth() + i, 1);

    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    const year = targetDate.getFullYear();

    keys.push(`${year}-${month}`);
  }
  return keys;
};

export const getWeekDates = (week: Date) => {
  const start = new Date(week);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    );
  }
  return dates;
};

export const formatToPolishDecimal = (value: number) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return value;
  }

  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

// export const formatWeeksString = (weeksCount: number) => {
//   const lastDigit = weeksCount % 10;
//   const lastTwoDigits = weeksCount % 100;

//   if (weeksCount === 1) return 'tydzień';
//   if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'tygodni';
//   if (lastDigit >= 2 && lastDigit <= 4) return 'tygodnie';
//   return 'tygodni';
// };

export const formatWeeksString = (
  weeksCount: number,
  lang: LangCode = 'pl-PL'
) => {
  if (lang === 'de-DE') {
    if (weeksCount === 1) {
      return 'Woche';
    }

    return 'Wochen';
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

export const getMonthKeysFromWeek = (startOfWeek: Date): string[] => {
  const monthKeysSet = new Set<string>();

  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(startOfWeek);
    currentDay.setDate(startOfWeek.getDate() + i);

    const month = (currentDay.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDay.getFullYear();

    const monthKey = `${year}-${month}`;
    monthKeysSet.add(monthKey);
  }

  return Array.from(monthKeysSet);
};

export function getWeeksInRange(startDate: Date, endDate: Date): Date[] {
  const weeks: Date[] = [];
  let currentWeekStart = getStartOfWeek(startDate);
  const endWeekStart = getStartOfWeek(endDate);

  while (currentWeekStart <= endWeekStart) {
    weeks.push(new Date(currentWeekStart));
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  return weeks;
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const newDate = new Date(d);
  newDate.setDate(diff);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

export function getPreviousWeek(date: Date): Date {
  const previousWeek = new Date(date);
  previousWeek.setDate(previousWeek.getDate() - 7);
  return getStartOfWeek(previousWeek);
}

export function getNextWeek(date: Date): Date {
  const previousWeek = new Date(date);
  previousWeek.setDate(previousWeek.getDate() + 7);
  return getStartOfWeek(previousWeek);
}

export function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
