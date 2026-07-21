import { useQueries } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getWorkLogs } from '../../api';
import { VacationApi } from '@/entities/vacations';
import { getMonthKeysFromWeek } from '@/shared/lib/date';

export const useReportData = (weekStarts: Date[]) => {
  return useQueries({
    queries: weekStarts.map((weekStart) => ({
      queryKey: ['weekReportData', weekStart.toISOString()],
      queryFn: async () => {
        const weekEnd = dayjs(weekStart).add(6, 'day').toDate();
        const [workLogs, vacations] = await Promise.all([
          getWorkLogs(weekStart, weekEnd),
          VacationApi.getVacationListForMonths(getMonthKeysFromWeek(weekStart)),
        ]);
        return { weekStart, workLogs, vacations };
      },
    })),
  });
};
