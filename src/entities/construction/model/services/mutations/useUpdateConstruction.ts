import { updateConstruction } from '../../../api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Construction } from '../../types';

interface UpdateConstructionMutation {
  constructionId: string | undefined;
  payload: Partial<Construction>;
}

export const useUpdateConstruction = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({
      constructionId,
      payload,
    }: UpdateConstructionMutation) => {
      await updateConstruction(constructionId!, payload);
      return constructionId;
    },

    onSuccess: (constructionId) => {
      queryClient.invalidateQueries({
        queryKey: ['construction', constructionId],
      });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
    },
    onError: (error: Error) => {
      console.error('Update construction error:', error);
    },
  });

  return updateMutation; 
};
