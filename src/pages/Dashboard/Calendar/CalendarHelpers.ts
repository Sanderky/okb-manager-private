import dayjs, { Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import type { InfoEventSeverity } from '../../../types';

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
  id?: string;
  groupId?: string;

  date: Dayjs;
  startDate: Dayjs;
  endDate: Dayjs;
  title: string;
  severity: InfoEventSeverity;
  description?: string;

  employeeIds: string[];
  constructionIds: string[];
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

export const AVAILABLE_SEVERITIES: InfoEventSeverity[] = [
  'info',
  'warning',
  'error',
  'success',
  'hotel',
  'other',
];

export const getSeverityLabel = (severity: InfoEventSeverity): string => {
  switch (severity) {
    case 'error':
      return 'Krytyczne';
    case 'warning':
      return 'Ostrzeżenie';
    case 'success':
      return 'Sukces';
    case 'info':
      return 'Info';
    case 'employee':
      return 'Pracownik';
    case 'hotel':
      return 'Hotel';
    default:
      return 'Inne';
  }
};

export const validateCalendarEvent = (
  title: string,
  startDate: Dayjs,
  endDate: Dayjs,
  severity: string
): { isValid: boolean; error?: string } => {
  if (!title || !title.trim()) {
    return { isValid: false, error: 'Tytuł wydarzenia jest wymagany' };
  }

  if (!startDate || !endDate) {
    return { isValid: false, error: 'Wybierz zakres dat' };
  }

  if (!severity) {
    return { isValid: false, error: 'Wybierz typ wydarzenia (wagę)' };
  }

  if (endDate.isBefore(startDate, 'day')) {
    return {
      isValid: false,
      error: 'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia',
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
