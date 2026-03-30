import { useQuery } from '@tanstack/react-query';
import { getLodgings } from '../api';

export const useLodgings = () => {
  const { data: lodgings = [], isLoading } = useQuery({
    queryKey: ['lodgings'],
    queryFn: getLodgings,
  });

  return {
    lodgings,
    isLoading,
  };
};
