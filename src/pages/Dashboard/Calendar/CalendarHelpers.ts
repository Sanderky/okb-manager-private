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
  | { type: 'eventDetails' }
  | { type: 'editEvent' }
  | { type: 'moreEvents'; day: CalendarDay };

export const pastelColors = [
  '#E4B7A0',
  '#D9B48F',
  '#D1C38E',
  '#A8C49A',
  '#91B6A4',
  '#8CBAC9',
  '#9BAFD9',
  '#A59ACB',
  '#B69FC8',
  '#C3A6A0',
  '#CFA77A',
  '#B8C09F',
  '#8AA6A3',
  '#7FA1B2',
  '#9CA0B8',
  '#A6989E',
  '#C2A78C',
  '#B5B68F',
  '#8CA3A3',
  '#A4A9B1',
];

export const validateVacation = (
  employeeId: string,
  startDate: Dayjs,
  endDate: Dayjs,
  vacations: Vacation[]
): { isValid: boolean; error?: string } => {
  if (!employeeId) {
    return { isValid: false, error: 'Wybierz pracownika' };
  }

  if (!startDate || !endDate) {
    return { isValid: false, error: 'Wybierz zakres dat' };
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
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts[parts.length - 1]?.charAt(0) ?? '';
  return `${first}. ${last}.`.toUpperCase();
};
