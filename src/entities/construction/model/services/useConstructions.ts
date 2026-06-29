import { useQuery } from '@tanstack/react-query';
import { getConstructionList } from '../../api';

export const useConstructions = (enabled = true) => {
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['constructions'],
    queryFn: () => getConstructionList(),
    enabled,
  });

  return {
    constructions: data,
    isLoading,
    isError,
    refetch,
  };
};
