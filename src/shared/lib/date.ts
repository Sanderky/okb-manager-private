import dayjs, { Dayjs } from 'dayjs';

export const toSqlDate = (
  date?: Date | string | Dayjs | null
): string | null => {
  if (!date) return null;
  return dayjs(date).format('YYYY-MM-DD');
};

