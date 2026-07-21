import dayjs, { Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import type { TFunction } from 'i18next';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export const validateCalendarEvent = (
  title: string,
  startDate: Dayjs,
  endDate: Dayjs,
  severity: string,
  t: TFunction
): { isValid: boolean; error?: string } => {
  if (!title || !title.trim()) {
    return { isValid: false, error: t('validation.titleRequired') };
  }

  if (!startDate || !endDate) {
    return { isValid: false, error: t('validation.dateRangeRequired') };
  }

  if (!severity) {
    return { isValid: false, error: t('validation.severityRequired') };
  }

  if (endDate.isBefore(startDate, 'day')) {
    return {
      isValid: false,
      error: t('validation.endDateBeforeStartDate'),
    };
  }

  return { isValid: true };
};
