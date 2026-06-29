import { useQuery } from '@tanstack/react-query';
import { getEmployee } from '../../api/employees';

export const useEmployee = (employeeId: string) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => getEmployee(employeeId),
    enabled: !!employeeId,
  });

  return {
    employee: data,
    isLoading,
    isError,
  };
};
