import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLodging } from '../../api';
import type { Lodging } from '../types';

export const useUpdateLodging = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; data: Partial<Lodging> }) =>
      updateLodging(vars.id, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodgings'] });
    },
  });
};
