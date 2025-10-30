import type { Construction } from '../../../types';
import type { ConstructionFormState } from './ConstructionForm';

export const validate = (
  values: Partial<Omit<Construction, 'id'>>
): Partial<Record<keyof ConstructionFormState['values'], string>> => {
  const errors: Partial<Record<keyof ConstructionFormState['values'], string>> =
    {};

  if (!values.name || values.name.trim() === '') {
    errors.name = 'Nazwa jest wymagana.';
  } else if (values.name.length > 100) {
    errors.name = 'Nazwa nie może być dłuższa niż 100 znaków.';
  }

  if (!values.startDate) {
    errors.startDate = 'Data rozpoczęcia jest wymagana.';
  }

  if (values.location && values.location.length > 100) {
    errors.location = 'Lokalizacja nie może być dłuższa niż 100 znaków.';
  }

  if (values.contractor && values.contractor.length > 100) {
    errors.contractor = 'Wykonawca nie może być dłuższy niż 100 znaków.';
  }

  return errors;
};
