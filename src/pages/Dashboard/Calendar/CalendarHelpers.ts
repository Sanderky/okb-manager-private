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

export const pastelColors = [
  '#E4B7A0', // przygaszony brązowo-różowy (ciepły neutralny)
  '#D9B48F', // piaskowy beż
  '#D1C38E', // oliwkowo-żółty pastel
  '#A8C49A', // szałwiowa zieleń
  '#91B6A4', // zgaszona mięta
  '#8CBAC9', // morski błękit
  '#9BAFD9', // przydymiony błękit
  '#A59ACB', // szaroniebieski fiolet
  '#B69FC8', // pastelowy fiolet z szarością
  '#C3A6A0', // gliniany róż
  '#CFA77A', // bursztynowy beż
  '#B8C09F', // zielony khaki pastel
  '#8AA6A3', // chłodny morski
  '#7FA1B2', // stalowy błękit
  '#9CA0B8', // gołębi niebieski
  '#A6989E', // neutralny róż z szarością
  '#C2A78C', // jasny brązowy pastel
  '#B5B68F', // zgaszona zieleń z beżem
  '#8CA3A3', // przydymiona morska zieleń
  '#A4A9B1', // stalowo-szary pastel
];

export const getColorForEmployee = (id: string): string => {
  if (!id) return pastelColors[0];

  // Lepszy hash - inspirowany FNV-1a z rotacją bitów
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
    hash ^= hash >>> 1; // mieszanie bitów
    hash |= 0; // 32-bit
  }

  // Stabilny wybór koloru z pastelColors
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
