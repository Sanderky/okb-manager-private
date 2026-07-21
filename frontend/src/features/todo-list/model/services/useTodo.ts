import { useQuery } from '@tanstack/react-query';
import { getTodos } from '../../api';

export const useTodo = (enabled = true) => {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
    enabled,
  });

  return { data, isLoading, isError };
};
