import { removeConstruction } from '../../../api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useDeleteMutation = () => {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (constructionId: string) => removeConstruction(constructionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
    },
  });

  return deleteMutation;
};
