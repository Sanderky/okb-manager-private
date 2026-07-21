import { useQuery } from '@tanstack/react-query';
import { getUpcomingEventsForEmployee } from '../../api';

export const useUpcomingEventsForEmployee = (employeeId: string) => {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['calendarEvents', 'upcoming', 'employee', employeeId],
    queryFn: () => getUpcomingEventsForEmployee(employeeId),
    enabled: !!employeeId,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
