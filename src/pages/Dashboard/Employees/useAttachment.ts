import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmployeeAttachments,
  uploadAttachment,
  deleteAttachment,
} from '../../../services/attachments';
import type { EmployeeAttachmentType, Attachment } from '../../../types';

export const useEmployeeAttachments = (employeeId: string | undefined) => {
  const queryClient = useQueryClient();
  const [loadingType, setLoadingType] = useState<EmployeeAttachmentType | null>(
    null
  );

  const { data: attachments = [], isLoading: isFetching } = useQuery({
    queryKey: ['attachments', employeeId],
    queryFn: () => getEmployeeAttachments(employeeId!),
    enabled: !!employeeId,
  });

  const getAttachmentsByType = useCallback(
    (type: EmployeeAttachmentType): Attachment[] => {
      const filtered = attachments.filter((a) => a.attachmentType === type);
      return filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    [attachments]
  );

  const uploadMutation = useMutation({
    mutationFn: ({
      file,
      type,
    }: {
      file: File;
      type: EmployeeAttachmentType;
    }) => uploadAttachment(employeeId!, file, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', employeeId] });
    },
    onSettled: () => setLoadingType(null),
  });

  const handleUpload = async (file: File, type: EmployeeAttachmentType) => {
    setLoadingType(type);

    await uploadMutation.mutateAsync({ file, type });
  };

  const deleteMutation = useMutation({
    mutationFn: ({ id, path }: { id: string; path: string }) =>
      deleteAttachment(id, path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', employeeId] });
    },
    onSettled: () => setLoadingType(null),
  });

  const handleDelete = async (
    attachment: Attachment,
    type: EmployeeAttachmentType
  ) => {
    if (!attachment.id) return;
    setLoadingType(type);
    await deleteMutation.mutateAsync({
      id: attachment.id,
      path: attachment.path,
    });
  };

  return {
    attachments,
    getAttachmentsByType,
    handleUpload,
    handleDelete,
    loadingType,
    isFetching,
  };
};

export default useEmployeeAttachments;
