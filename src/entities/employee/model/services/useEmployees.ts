import { useQuery } from '@tanstack/react-query';
import { getEmployeeList } from '../../api/employees/api';

export const useEmployees = () => {
  const {
    data = [],
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
  });

  return {
    employees: data,
    isLoading,
    isError,
    refetch
  };
};
