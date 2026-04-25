import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteContractor } from '../api';

export const useDeleteContractor = () => {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: deleteContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
    },
  });
  return deleteMutation;
};
