import { updateConstruction } from '../../../api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateConstructionNote {
  constructionId?: string;
  note: string;
}

export const useUpdateConstructionNote = () => {
  const queryClient = useQueryClient();

  const updateNoteMutation = useMutation({
    mutationFn: async ({ constructionId, note }: UpdateConstructionNote) => {
      await updateConstruction(constructionId!, { note });
      return constructionId;
    },
    onSuccess: (constructionId) => {
      queryClient.invalidateQueries({
        queryKey: ['construction', constructionId],
      });
    },
    onError: (error: Error) => {
      console.error('Update note error:', error);
    },
  });

  return updateNoteMutation;
};
