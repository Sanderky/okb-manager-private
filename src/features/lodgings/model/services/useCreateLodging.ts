import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLodging } from '../../api';

export const useCreateLodging = () => {
  const queryClient = useQueryClient();

  return useMutation({
  mutationFn: createLodging,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lodgings'] }),
});
};
