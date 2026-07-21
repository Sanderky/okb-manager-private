import { createEmployee } from '../../../api/employees';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Employee } from '../../types';

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (newEmployee: Partial<Employee>) =>
      createEmployee(newEmployee as Employee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error: Error) => {
      console.error('Create employee error:', error);
    },
  });

  return createMutation;
};
