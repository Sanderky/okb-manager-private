import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import isoWeek from 'dayjs/plugin/isoWeek';
import i18n from '../config/i18n/i18n';

dayjs.extend(isoWeek);

export const formatDecimal = (value: number, targetLang?: string) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return value;
  }

  const langToUse = targetLang || i18n.language || 'pl-PL';

  return new Intl.NumberFormat(langToUse, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};
