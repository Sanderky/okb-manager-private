import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmployeeAttachments,
  uploadAttachment,
  deleteAttachment,
} from '../../../services/attachments';
import type { EmployeeAttachmentType, Attachment } from '../../../types';
import useNotifications from '../../../hooks/useNotifications/useNotifications';

export const useEmployeeAttachments = (employeeId: string | undefined) => {
  const queryClient = useQueryClient();
  const notifications = useNotifications();

  const [loadingType, setLoadingType] = useState<EmployeeAttachmentType | null>(
    null
  );
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);

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

  const handleUpload = useCallback(
    async (filesInput: File[] | FileList, type: EmployeeAttachmentType) => {
      const files = Array.from(filesInput);

      if (files.length === 0) return;
      setIsUploadDialogOpen(true);

      setLoadingType(type);
      setUploadProgress({});

      for (const file of files) {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
      }

      const uploadPromises = files.map(async (file) => {
        try {
          await uploadAttachment(employeeId!, file, type, (progress) => {
            setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
          });
          return file.name;
        } catch (error) {
          setUploadProgress((prev) => ({ ...prev, [file.name]: -1 }));
          console.error('Krytyczny błąd uploadu:', error);

          throw new Error(`Błąd pliku ${file.name}`);
        }
      });

      try {
        const results = await Promise.allSettled(uploadPromises);
        const successful = results.filter((r) => r.status === 'fulfilled');
        const failed = results.filter((r) => r.status === 'rejected');

        if (successful.length > 0) {
          await queryClient.invalidateQueries({
            queryKey: ['attachments', employeeId],
          });
        }

        if (failed.length === 0) {
          notifications.show(`Przesłano pomyślnie ${files.length} plików`, {
            severity: 'success',
          });
        } else if (successful.length === 0) {
          notifications.show(
            'Wszystkie pliki napotkały błąd podczas wysyłania.',
            {
              severity: 'error',
            }
          );
        } else {
          notifications.show(
            `Przesłano ${successful.length} z ${files.length} plików. Błędy: ${failed.length}`,
            { severity: 'warning', autoHideDuration: 6000 }
          );
        }
      } catch (error) {
        console.error('Krytyczny błąd uploadu:', error);
      } finally {
        setTimeout(() => {
          setLoadingType(null);
        }, 500);
      }
    },
    [employeeId, queryClient, notifications]
  );

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
    uploadProgress,
    isUploadDialogOpen,
    setIsUploadDialogOpen,
  };
};

export default useEmployeeAttachments;
