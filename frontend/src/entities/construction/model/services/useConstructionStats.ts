import { useQuery } from '@tanstack/react-query';
import { getConstructionStats } from '../../api';

export const useConstructionStats = (enabled = true) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['constructions', 'stats'],
    queryFn: getConstructionStats,
    enabled,
  });
  return {
    data,
    isLoading,
    isError,
  };
};
