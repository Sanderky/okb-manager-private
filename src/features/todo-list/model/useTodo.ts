import { useQuery } from '@tanstack/react-query';
import { getTodos } from '../api';

export const useTodo = () => {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
  });

  return { data, isLoading, isError };
};
