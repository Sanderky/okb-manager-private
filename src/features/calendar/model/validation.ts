import dayjs, { Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

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
