import { useQuery } from '@tanstack/react-query';
import { getConstruction } from '../../api';

export const useConstruction = (constructionId: string | undefined) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['construction', constructionId],
    queryFn: () => getConstruction(constructionId!),
    enabled: !!constructionId,
  });

  return {
    construction: data,
    isLoading,
    isError,
  };
};
