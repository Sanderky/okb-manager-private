import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);
dayjs.locale('pl');

export const formatToPolishDecimal = (value: number) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return value;
  }

  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};
