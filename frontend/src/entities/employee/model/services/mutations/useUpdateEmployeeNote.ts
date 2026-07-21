import { updateEmployee } from '../../../api/employees';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateEmployeeNoteMutation {
  employeeId: string;
  note: string;
}

export const useUpdateEmployeeNote = () => {
  const queryClient = useQueryClient();
  const updateNoteMutation = useMutation({
    mutationFn: async ({ employeeId, note }: UpdateEmployeeNoteMutation) => {
      await updateEmployee(employeeId, { note });
      return employeeId;
    },
    onSuccess: (employeeId) => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
    onError: (error: Error) => {
      console.error('Update note error:', error);
    },
  });

  return updateNoteMutation;
};
