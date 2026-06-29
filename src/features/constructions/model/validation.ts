import dayjs from 'dayjs';
import type { Construction } from '@/entities/construction';
import type { ValidationErrors } from './types';

export const validate = (
  values: Partial<Omit<Construction, 'id'>>
): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!values.name || values.name.trim() === '') {
    errors.name = 'Nazwa jest wymagana.';
  } else if (values.name.length > 255) {
    errors.name = 'Nazwa nie może być dłuższa niż 255 znaków.';
  }

  if (!values.startDate) {
    errors.startDate = 'Data rozpoczęcia jest wymagana.';
  }

  if (values.startDate && values.endDate) {
    const startDate = dayjs(values.startDate).startOf('day');
    const today = dayjs().startOf('day');
    const endDate = dayjs(values.endDate).startOf('day');

    if (endDate.isBefore(startDate)) {
      errors.endDate =
        'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.';
    } else if (endDate.isAfter(today)) {
      errors.endDate = 'Data zakończenia nie może być z przyszłości.';
    }
  }

  if (values.location && values.location.length > 255) {
    errors.location = 'Lokalizacja nie może być dłuższa niż 255 znaków.';
  }

  if (values.status === undefined) {
    errors.status = 'Status jest wymagany.';
  }

  return errors;
};
