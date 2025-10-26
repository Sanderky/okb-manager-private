import dayjs, { Dayjs } from 'dayjs';
import type { Employee, Vacation } from '../../../types';

export const pastelColors = [
  '#AEC6CF',
  '#BFD8B8',
  '#C2B9B0',
  '#E6CBA8',
  '#F5DD90',
  '#A8C3BC',
  '#C1C8E4',
  '#D5E1DF',
  '#E2CFC4',
  '#C5D5CB',
  '#D0B8A8',
  '#BFCBA8',
  '#C7D3D4',
  '#E0D8B0',
  '#B5C9C3',
  '#D4C5C7',
  '#BACDB0',
  '#C7BEA2',
  '#A7BBC7',
  '#D9CAB3',
];

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
  | { type: 'moreEvents'; day: CalendarDay };

export const getColorForEmployee = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % pastelColors.length;
  return pastelColors[index];
};

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
