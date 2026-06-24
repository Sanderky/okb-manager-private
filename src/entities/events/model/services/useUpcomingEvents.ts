import { useQuery } from '@tanstack/react-query';
import { getNearestUpcomingEvents } from '../../api';

export const useUpcomingEvents = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['calendarEvents', 'upcoming', 'all'],
    queryFn: () => getNearestUpcomingEvents(),
  });

  return {
    data,
    isLoading,
  };
};
