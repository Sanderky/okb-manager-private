import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const useWeekDays = () => {
  const { i18n } = useTranslation(); // Potrzebujemy tego, by nasłuchiwać zmian języka

  const weekDays = useMemo(() => {
    // Generujemy tablicę od 1 (poniedziałek) do 7 (niedziela)
    return [1, 2, 3, 4, 5, 6, 7].map((d) =>
      // Używamy formatu 'ddd', który daje skrócone nazwy dni z kropką (np. "Pon.", "Wt.", "Mon")
      // Jeśli wolisz jeszcze krótsze (np. "Pn", "Wt", "Mo"), użyj 'dd'
      dayjs().isoWeekday(d).format('ddd')
    );
  }, [i18n.language]);

  return weekDays;
};
