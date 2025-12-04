import dayjs from 'dayjs';
import type { Construction } from '../../../types';
import type { ConstructionFormState } from './ConstructionForm';

export const sortConstructions = (
  constructions: Construction[]
): Construction[] => {
  return [...constructions].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();

    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
};

export const shouldBeInactive = (endDate: Date | null | undefined) => {
  if (!endDate) {
    return false;
  }

  const today = new Date().toDateString();
  const end = new Date(endDate).toDateString();

  return new Date(end) <= new Date(today);
};

export const validate = (
  values: Partial<Omit<Construction, 'id'>>
): Partial<Record<keyof ConstructionFormState['values'], string>> => {
  const errors: Partial<Record<keyof ConstructionFormState['values'], string>> =
    {};

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
