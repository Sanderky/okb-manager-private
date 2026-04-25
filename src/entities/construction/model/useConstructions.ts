import { useQuery } from '@tanstack/react-query';
import { getConstructionList } from '../api';

export const useConstructions = () => {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['constructions'],
    queryFn: () => getConstructionList(),
  });

  return {
    constructions: data,
    isLoading,
    isError,
  };
};
