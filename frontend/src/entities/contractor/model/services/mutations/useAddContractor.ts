import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addContractor } from '../../../api';

export const useAddContractor = () => {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: addContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
    },
  });

  return addMutation;
};
