import type { Construction } from '@/entities/construction';
import { createConstruction } from '@/entities/construction/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useAddConstructionMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (newConstruction: Partial<Construction>) =>
      createConstruction(newConstruction as Construction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
    },
    onError: (error: Error) => {
      console.error('Create construction error:', error);
    },
  });

  return createMutation;
};
