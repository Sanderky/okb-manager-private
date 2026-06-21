import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Employee } from '../../types';
import { updateEmployee } from '../../../api/employees';

interface UpdateEmployeeMutation {
  employeeId: string;
  payload: Partial<Employee>;
}

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ employeeId, payload }: UpdateEmployeeMutation) => {
      await updateEmployee(employeeId, payload);
      return employeeId;
    },
    onSuccess: (employeeId) => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error: Error) => {
      console.error('Update employee error:', error);
    },
  });

  return updateMutation;
};
