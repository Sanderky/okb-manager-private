import type { TFunction } from 'i18next';
import type { EventCategory } from '../model/types';

export const getCategoryLabel = (
  category: EventCategory,
  t: TFunction
): string => {
  switch (category) {
    case 'info':
      return t('calendar:categories.info');
    case 'lodging':
      return t('calendar:categories.lodging');
    case 'payroll':
      return t('calendar:categories.payroll');
    case 'accounting':
      return t('calendar:categories.accounting');
    case 'other':
      return t('calendar:categories.other');
    default:
      return t('calendar:categories.none');
  }
};
