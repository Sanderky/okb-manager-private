import { useQuery } from '@tanstack/react-query';
import { getScheduleListForDateRange } from '../api';

export const useSchedule = (start: Date, end: Date) => {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['schedules', `${start}-${end}`],
    queryFn: async () => {
      return await getScheduleListForDateRange(start, end);
    },
  });

  return {
    schedule: data,
    isLoading,
    isError,
  };
};
