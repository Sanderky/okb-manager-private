import { type Contractor } from '@/entities/contractor';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateContractor } from '../api';

export const useUpdateContractor = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contractor> }) =>
      updateContractor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
      queryClient.invalidateQueries({ queryKey: ['construction'] });
    },
  });

  return updateMutation;
};
