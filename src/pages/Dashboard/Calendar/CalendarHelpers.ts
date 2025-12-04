import dayjs, { Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import type { Employee, Vacation } from '../../../types';

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

export interface CalendarGridProps {
  monthGrid: CalendarDay[][];
  currentMonth: Dayjs;
  selectDay: Dayjs | null;
  onDayClick: (day: Dayjs) => void;
  isDayInRange: (day: Dayjs) => boolean;
  handleEventClick: (event: CalendarEvent) => void;
  setActiveDialog: (dialog: ActiveDialog) => void;
}

export const validateVacation = (
  employeeId: string,
  start: Dayjs,
  end: Dayjs,
  existingVacations: Vacation[],
  color: string
): { isValid: boolean; error?: string } => {
  if (!employeeId) {
    return { isValid: false, error: 'Wybierz pracownika' };
  }
  if (!start || !end) {
    return { isValid: false, error: 'Wybierz daty' };
  }
  if (end.isBefore(start, 'day')) {
    return {
      isValid: false,
      error: 'Data końcowa nie może być przed początkową',
    };
  }
  if (!color) {
    return { isValid: false, error: 'Wybierz kolor' };
  }

  const hasOverlap = existingVacations.some((v) => {
    if (v.employeeId !== employeeId) return false;

    const vStart = dayjs(v.startDate).startOf('day');
    const vEnd = dayjs(v.endDate).endOf('day');

    const newStart = start.startOf('day');
    const newEnd = end.endOf('day');

    return newStart.isSameOrBefore(vEnd) && vStart.isSameOrBefore(newEnd);
  });

  if (hasOverlap) {
    return {
      isValid: false,
      error: 'Ten pracownik ma już urlop w wybranym terminie.',
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
