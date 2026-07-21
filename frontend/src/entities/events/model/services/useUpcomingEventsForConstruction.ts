import { useQuery } from '@tanstack/react-query';
import { getUpcomingEventsForConstruction } from '../../api';

export const useUpcomingEventsForConstruction = (
  constructionId: string | undefined
) => {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['calendarEvents', 'upcoming', 'construction', constructionId],
    queryFn: () => getUpcomingEventsForConstruction(constructionId ?? ''),
    enabled: !!constructionId,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
