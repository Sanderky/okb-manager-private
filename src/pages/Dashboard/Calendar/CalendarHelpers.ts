import dayjs, { Dayjs } from 'dayjs';
import type { Employee, Vacation } from '../../../types';

export const pastelColors = [
  '#F7C8C2', // różowy grapefruit
  '#F9D8B6', // kremowy brzoskwiniowy
  '#F6E7B4', // jasny żółty z nutą piasku
  '#D5EDB5', // miękka limonkowa zieleń
  '#BDE4C9', // chłodna miętowa
  '#B9E1E0', // błękit z turkusem
  '#C3D3F3', // pastelowy niebieski
  '#D3C4F3', // pastelowy lawendowy
  '#E7C1E0', // różowo-fioletowy
  '#F3C1C6', // malinowo-pastelowy
  '#F1D0B8', // jasny toffi
  '#E8E1B5', // kremowo-żółty
  '#CAE2C4', // pastelowa szałwia
  '#C2E5DA', // morska mięta
  '#C6DCF1', // niebieski obłok
  '#D7C7EE', // pastelowy fiolet
  '#E8C7D9', // malinowy róż
  '#F2CCC3', // delikatny koralowy
  '#E4D8B4', // jasny beż-żółty
  '#CBE1CE', // zieleń z szarą nutą
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
