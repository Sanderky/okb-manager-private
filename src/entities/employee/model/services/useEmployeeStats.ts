import { useQuery } from '@tanstack/react-query';
import { getEmployeeStats } from '../../api/employees';

export const useEmployeeStats = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['employees', 'stats'],
    queryFn: getEmployeeStats,
  });
  return {
    data,
    isLoading,
  };
};
