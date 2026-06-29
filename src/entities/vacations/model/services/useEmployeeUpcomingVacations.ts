import { useQuery } from '@tanstack/react-query';
import { getUpcomingVacationsForEmployee } from '../../api';

export const useEmployeeUpcomingVacations = (employeeId: string) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['vacations', 'employeeVacations', employeeId],
    queryFn: () => getUpcomingVacationsForEmployee(employeeId),
    enabled: !!employeeId,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
