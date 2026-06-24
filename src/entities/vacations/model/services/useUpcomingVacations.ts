import { useQuery } from '@tanstack/react-query';
import { VacationApi } from '@/entities/vacations';

export const useUpcomingVacations = (enabled = true) => {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['vacations', 'upcoming-vacations'],
    queryFn: () => VacationApi.getUpcomingVacations(),
    enabled,
  });

  return { data, isLoading, isError };
};
