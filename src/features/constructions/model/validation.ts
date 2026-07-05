import dayjs from 'dayjs';
import type { Construction } from '@/entities/construction';
import type { ValidationErrors } from './types';

export const validate = (
  values: Partial<Omit<Construction, 'id'>>
): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!values.name || values.name.trim() === '') {
    errors.name = 'validation.nameRequired';
  } else if (values.name.length > 255) {
    errors.name = 'validation.nameTooLong';
  }

  if (!values.startDate) {
    errors.startDate = 'validation.startDateRequired';
  }

  if (values.startDate && values.endDate) {
    const startDate = dayjs(values.startDate).startOf('day');
    const today = dayjs().startOf('day');
    const endDate = dayjs(values.endDate).startOf('day');

    if (endDate.isBefore(startDate)) {
      errors.endDate = 'validation.endDateBeforeStart';
    } else if (endDate.isAfter(today)) {
      errors.endDate = 'validation.endDateInFuture';
    }
  }

  if (values.location && values.location.length > 255) {
    errors.location = 'validation.locationTooLong';
  }

  if (values.status === undefined) {
    errors.status = 'validation.statusRequired';
  }

  return errors;
};
