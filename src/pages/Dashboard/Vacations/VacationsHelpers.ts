import dayjs, { Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import type { Vacation } from '../../../shared/model/types';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export const WEEK_DAYS = [
  'Pon.',
  'Wt.',
  'Śr.',
  'Czw.',
  'Pt.',
  'Sob.',
  'Niedz.',
];

export interface CalendarEvent {
  id: string;
  employeeName: string;
  employeeId: string;
  employeeActive: boolean;
  startDate: Dayjs;
  endDate: Dayjs;
  date: Dayjs;
  // groupId: string;
  color: string;
  description?: string;
}

export interface CalendarGridProps {
  onMoreClick: (data: CalendarDay) => void;
  monthGrid: CalendarDay[][];
  currentMonth: Dayjs;
  selectDay: Dayjs | null;
  onDayClick: (day: Dayjs) => void;
  isDayInRange: (day: Dayjs) => boolean;
  handleEventClick: (event: CalendarEvent) => void;
}

export interface CalendarDay {
  date: Dayjs;
  events: CalendarEvent[];
  slots?: Record<string, number>;
}

export type ActiveDialog =
  | { type: 'none' }
  | { type: 'addEvent' }
  | { type: 'editEvent' }
  | { type: 'moreEvents'; day: CalendarDay };

export const employeeColors = [
  '#EF9A9A', // Czerwony
  '#FFAB91', // Pomarańczowy
  '#FFCC80', // Jasny pomarańcz
  '#FFD54F', // Żółty pastel
  '#DCE775', // Żółto-zielony
  '#C5E1A5', // Zielony
  '#AED581', // Jasny zielony
  '#81C784', // Zielony neutralny
  '#80CBC4', // Szmaragdowy
  '#4DB6AC', // Turkus
  '#4DD0E1', // Cyjan pastel
  '#81D4FA', // Jasny niebieski
  '#64B5F6', // Niebieski mocniejszy
  '#9FA8DA', // Lawendowy
  '#7986CB', // Pastelowy indygo
  '#B39DDB', // Fioletowy
  '#CE93D8', // Różowy-fiolet
  '#F48FB1', // Różowy
  '#F06292', // Głęboki róż
  '#A1887F', // Brązowy
  '#BCAAA4', // Beżowy
];

// export const stringToColor = (str: string, s = 65, l = 45) => {
//   let hash = 0;
//   for (let i = 0; i < str.length; i++) {
//     hash = str.charCodeAt(i) + ((hash << 5) - hash);
//   }

//   const h = Math.abs(hash % 360);

//   return `hsl(${h}, ${s}%, ${l}%)`;
// };

export const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const goldenAngle = 137.508;
  const h = Math.abs((hash * goldenAngle) % 360);
  const l = 40 + (Math.abs(hash) % 20);
  const s = 65;

  return `hsl(${h}, ${s}%, ${l}%)`;
};

export const validateVacation = (
  employeeId: string,
  startDate: Dayjs,
  endDate: Dayjs,
  vacations: Vacation[],
  color: string
): { isValid: boolean; error?: string } => {
  if (!employeeId) {
    return { isValid: false, error: 'Wybierz pracownika' };
  }

  if (!startDate || !endDate) {
    return { isValid: false, error: 'Wybierz zakres dat' };
  }

  if (!color) {
    return { isValid: false, error: 'Wybierz kolor urlopu' };
  }

  if (endDate.isBefore(startDate, 'day')) {
    return {
      isValid: false,
      error: 'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia',
    };
  }

  const conflictingDates: string[] = [];

  let currentDate = startDate;
  while (currentDate.isSameOrBefore(endDate, 'day')) {
    const hasConflict = vacations.some((vacation) => {
      if (vacation.employeeId !== employeeId) return false;

      const existingStart = dayjs(vacation.startDate).startOf('day');
      const existingEnd = dayjs(vacation.endDate).startOf('day');
      const day = currentDate.startOf('day');

      return (
        day.isSameOrAfter(existingStart) && day.isSameOrBefore(existingEnd)
      );
    });

    if (hasConflict) {
      conflictingDates.push(currentDate.format('DD.MM.YYYY'));
    }

    currentDate = currentDate.add(1, 'day');
  }

  if (conflictingDates.length > 0) {
    return {
      isValid: false,
      error: `Pracownik ma już urlop w dniach: ${conflictingDates.join(', ')}`,
    };
  }

  return { isValid: true };
};

export const getInitials = (name: string): string => {
  if (!name?.trim()) return '';
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return `${parts[0]?.charAt(0) ?? ''}.`.toUpperCase();
  }

  const first = parts[0]?.charAt(0) ?? '';
  const last = parts[parts.length - 1]?.charAt(0) ?? '';
  return `${first}. ${last}.`.toUpperCase();
};

export const getDateStr = (
  start: Date | Dayjs | undefined,
  end: Date | Dayjs | undefined,
  showCount = false
) => {
  if (!start || !end) return '-';
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  const count = endDate.diff(startDate, 'day') + 1;
  if (startDate.isSame(endDate)) return startDate.format('DD.MM.YYYY');
  return `${startDate.format('DD.MM.YYYY')} - ${endDate.format('DD.MM.YYYY')}${showCount ? ` (${count} dni)` : ''}`;
};
