import { useQuery } from '@tanstack/react-query';
import { getEmployeeStats } from '../../api/employees';

export const useEmployeeStats = (enabled = true) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['employees', 'stats'],
    queryFn: getEmployeeStats,
    enabled,
  });
  return {
    data,
    isLoading,
    isError,
  };
};
