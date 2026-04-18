import { useQuery } from '@tanstack/react-query';
import { VacationApi } from '@/entities/vacations';

export const useUpcomingVacations = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['vacations', 'upcoming-vacations'],
    queryFn: () => VacationApi.getUpcomingVacations(),
  });

  return { data, isLoading };
};
