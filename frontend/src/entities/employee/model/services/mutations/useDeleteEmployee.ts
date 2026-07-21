import { removeEmployee } from '../../../api/employees';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      await removeEmployee(employeeId);
      return employeeId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: Error) => {
      console.error('Delete employee error:', error);
    },
  });

  return deleteMutation;
};
