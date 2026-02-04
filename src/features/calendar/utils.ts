import dayjs, { Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import type { EventCategory } from './types';

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

export const AVAILABLE_CATEGORIES: EventCategory[] = [
  'info',
  'lodging',
  'payroll',
  'accounting',
  'other',
];

export const getCategoryLabel = (category: EventCategory): string => {
  switch (category) {
    case 'info':
      return 'Info';
    case 'lodging':
      return 'Hotel';
    case 'payroll':
      return 'Płace';
    case 'accounting':
      return 'Księgowość';
    case 'other':
      return 'Inne';
    default:
      return 'Brak kategorii';
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
