import type { EventCategory } from '../model/types';

export const getCategoryLabelTranslationKey = (
  category: EventCategory
): string => {
  switch (category) {
    case 'info':
      return 'categories.info';
    case 'lodging':
      return 'categories.lodging';
    case 'payroll':
      return 'categories.payroll';
    case 'accounting':
      return 'categories.accounting';
    case 'other':
      return 'categories.other';
    default:
      return 'categories.none';
  }
};
