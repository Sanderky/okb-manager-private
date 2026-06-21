import { useQuery } from '@tanstack/react-query';
import { getHomeNote } from '../../api';

export const useHomeNote = (enabled = true) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['home', 'note'],
    queryFn: getHomeNote,
    enabled,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
