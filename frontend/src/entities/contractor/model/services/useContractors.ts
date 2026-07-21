import { useQuery } from '@tanstack/react-query';
import { getContractors } from '../../api';

export const useContractors = (enabled = true) => {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['contractors'],
    queryFn: getContractors,
    enabled: enabled,
  });

  return {
    data,
    isError,
    isLoading,
  };
};
