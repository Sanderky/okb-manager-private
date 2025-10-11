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
