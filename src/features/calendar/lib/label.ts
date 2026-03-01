import type { EventCategory } from '../model/types';

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
