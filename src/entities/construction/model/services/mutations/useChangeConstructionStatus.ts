import { updateConstruction } from '@/entities/construction/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateConstructionStatus {
  constructionId?: string;
  status: boolean;
  endDate?: Date;
}

export const useChangeConstructionStatus = () => {
  const queryClient = useQueryClient();

  const updateNoteMutation = useMutation({
    mutationFn: async ({
      constructionId,
      status,
      endDate,
    }: UpdateConstructionStatus) => {
      await updateConstruction(constructionId!, { status, endDate });
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
