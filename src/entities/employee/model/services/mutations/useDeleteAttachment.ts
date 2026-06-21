import { deleteAttachment } from '../../../api/attachments';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useDeleteEmployeeAttachment = () => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async ({
      employeeId,
      path,
    }: {
      employeeId: string | undefined;
      path: string;
    }) => {
      await deleteAttachment(path);
      return employeeId;
    },
    onSuccess: (employeeId) => {
      queryClient.invalidateQueries({ queryKey: ['attachments', employeeId] });
    },
  });

  return deleteMutation;
};
