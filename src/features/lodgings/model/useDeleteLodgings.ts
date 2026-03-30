import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteLodging } from '../api';

export const useDeleteLodging = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLodging,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodgings'] });
    },
  });
};
