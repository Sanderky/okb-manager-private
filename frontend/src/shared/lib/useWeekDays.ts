import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const useWeekDays = () => {
  const { i18n } = useTranslation();

  const weekDays = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 7].map((d) =>
      dayjs().isoWeekday(d).format('ddd')
    );
  }, [i18n.language]);

  return weekDays;
};
