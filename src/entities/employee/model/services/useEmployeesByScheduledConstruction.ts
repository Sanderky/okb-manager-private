import { useQuery } from '@tanstack/react-query';
import { getEmployeesByScheduledConstruction } from '../../api/employees';
import dayjs from 'dayjs';

export const useEmployeesByScheduledConstruction = (constructionId: string | undefined) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['schedules', 'employeesByConstruction', constructionId],
    queryFn: () =>
      getEmployeesByScheduledConstruction([constructionId!], dayjs().toDate()),
    enabled: !!constructionId,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
