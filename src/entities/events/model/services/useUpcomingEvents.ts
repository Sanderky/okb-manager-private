import { useQuery } from '@tanstack/react-query';
import { getNearestUpcomingEvents } from '../../api';

export const useUpcomingEvents = (enabled = true) => {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['calendarEvents', 'upcoming', 'all'],
    queryFn: () => getNearestUpcomingEvents(),
    enabled,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
