import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { getMonthKeysFromWeek } from '@/shared/lib/date';
import { getVacationListForMonths } from '../../api';

dayjs.extend(isSameOrBefore);

export const useEmployeeVacations = (currentWeek: Date) => {
  const {
    data: vacations = [],
    isLoading: vacationsLoading,
    error: vacationsError,
  } = useQuery({
    queryKey: ['vacations', currentWeek.toISOString()],
    queryFn: () => getVacationListForMonths(getMonthKeysFromWeek(currentWeek)),
  });

  const vacationMap = useMemo(() => {
    const map = new Map<string, Set<string>>();

    vacations.forEach((v) => {
      let c = dayjs(v.startDate);
      const e = dayjs(v.endDate);

      if (!map.has(v.employeeId)) {
        map.set(v.employeeId, new Set());
      }

      while (c.isSameOrBefore(e)) {
        map.get(v.employeeId)!.add(c.format('YYYY-MM-DD'));
        c = c.add(1, 'day');
      }
    });

    return map;
  }, [vacations]);

  const isEmployeeOnVacation = useCallback(
    (id: string, d: Date) =>
      vacationMap.get(id)?.has(dayjs(d).format('YYYY-MM-DD')) ?? false,
    [vacationMap]
  );

  return {
    vacationsLoading,
    vacationsError,
    isEmployeeOnVacation,
  };
};
