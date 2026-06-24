import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeVacation } from '@/entities/vacations/api';

export const useDeleteVacation = () => {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeVacation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });
    },
  });

  return deleteMutation;
};
