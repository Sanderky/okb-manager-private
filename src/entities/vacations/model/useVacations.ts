import { useQuery } from '@tanstack/react-query';
import type { Vacation } from './types';
import * as VacationApi from '../api';

export const useVacations = (monthKeys: string[]) => {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery<Vacation[], Error>({
    queryKey: ['vacations', monthKeys],
    queryFn: () => VacationApi.getVacationListForMonths(monthKeys),
  });

  return { data, isLoading, isError };
};
