import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getWorkLogs } from '../../api';

export const useWorkLogs = (currentWeek: Date) => {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['workLogs', currentWeek.toISOString()],
    queryFn: async () => {
      const weekEnd = dayjs(currentWeek).add(6, 'day').toDate();
      return await getWorkLogs(currentWeek, weekEnd);
    },
  });

  return {
    workLogs: data,
    isLoading,
    isError,
  };
};
