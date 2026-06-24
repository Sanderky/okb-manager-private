import { useQuery } from '@tanstack/react-query';
import { getConstructionStats } from '../../api';

export const useConstructionStats = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['constructions', 'stats'],
    queryFn: getConstructionStats,
  });
  return {
    data,
    isLoading,
  };
};
