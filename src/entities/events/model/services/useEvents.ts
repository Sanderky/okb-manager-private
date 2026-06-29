import { useQuery } from '@tanstack/react-query';
import { getCalendarEventsForMonths } from '../../api';
import type { InfoEvent } from '../types';

export const useEvents = (monthKeys: string[]) => {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery<InfoEvent[], Error>({
    queryKey: ['calendarEvents', monthKeys],
    queryFn: () => getCalendarEventsForMonths(monthKeys),
  });

  return {
    events: data,
    isLoading,
    isError,
  };
};
