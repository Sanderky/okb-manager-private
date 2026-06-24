import { useQuery } from '@tanstack/react-query';
import { getEmployeeList } from '../../api/employees/api';

export const useEmployees = (enabled = true) => {
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
    enabled,
  });

  return {
    employees: data,
    isLoading,
    isError,
    refetch,
  };
};
