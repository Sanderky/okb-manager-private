import { useQuery } from '@tanstack/react-query';
import { getEmployeeAttachments } from '../../api/attachments';

export const useEmployeeAttachments = (employeeId: string | undefined) => {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['attachments', employeeId],
    queryFn: () => getEmployeeAttachments(employeeId!),
    enabled: !!employeeId,
  });

  return {
    attachments: data,
    isLoading,
    isError,
  };
};
