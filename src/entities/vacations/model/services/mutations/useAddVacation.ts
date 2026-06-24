import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Vacation } from '../../types';
import { createVacation } from '@/entities/vacations/api';

export const useAddVacation = () => {
  const queryClient = useQueryClient();
  const addMutation = useMutation({
    mutationFn: (payload: Partial<Vacation>) => createVacation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] }); // zachowane ze starego kodu
      queryClient.invalidateQueries({ queryKey: ['workLogs'] }); // zachowane ze starego kodu
    },
  });

  return addMutation;
};
