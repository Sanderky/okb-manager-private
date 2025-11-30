import dayjs, { Dayjs } from 'dayjs';
import type { Employee, Vacation } from '../../../types';

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
  id?: string;
  employee: Employee;
  date: Dayjs;
  startDate: Dayjs;
  endDate: Dayjs;
  groupId: string;
  color: string;
  description?: string;
}

export interface CalendarGridProps {
  monthGrid: CalendarDay[][];
  currentMonth: Dayjs;
  selectDay: Dayjs | null;
  onDayClick: (day: Dayjs) => void;
  isDayInRange: (day: Dayjs) => boolean;
  handleEventClick: (event: CalendarEvent) => void;
  setActiveDialog: (dialog: ActiveDialog) => void;
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

// '#EF9A9A', // Czerwony
// '#FFAB91', // Pomarańczowy
// '#FFCC80', // Jasny pomarańcz
// '#C5E1A5', // Zielony
// '#AED581', // Jasny zielony
// '#80CBC4', // Szmaragdowy
// '#81D4FA', // Jasny niebieski
// '#90CAF9', // Niebieski
// '#9FA8DA', // Lawendowy
// '#B39DDB', // Fioletowy
// '#CE93D8', // Różowy-fiolet
// '#F48FB1', // Różowy
// '#A1887F', // Brązowy

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

  if (endDate.isBefore(startDate)) {
    return {
      isValid: false,
      error: 'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia',
    };
  }

  let currentDate = startDate;
  const conflictingDates: string[] = [];

  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
    const hasConflict = vacations.some(
      (vacation) =>
        vacation.employeeId === employeeId &&
        dayjs(vacation.date).isSame(currentDate, 'day')
    );

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
