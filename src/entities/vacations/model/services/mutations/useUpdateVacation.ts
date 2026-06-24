import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Vacation } from '../../types';
import { updateVacation } from '@/entities/vacations/api';

export const useUpdateVacation = () => {
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vacation> }) =>
      updateVacation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });
    },
  });

  return updateMutation;
};
