import { useState, useCallback } from 'react';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import {
  uploadAttachment,
  type Attachment,
  type EmployeeAttachmentType,
  useEmployeeAttachments as useEmployeeAttachmentsService,
  useDeleteEmployeeAttachment,
} from '@/entities/employee';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useEmployeeAttachments = (employeeId: string | undefined) => {
  const { t } = useTranslation('employees');
  const queryClient = useQueryClient();
  const notifications = useNotifications();

  const [loadingType, setLoadingType] = useState<EmployeeAttachmentType | null>(
    null
  );
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);

  const { attachments, isLoading: isFetching } =
    useEmployeeAttachmentsService(employeeId);

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
          console.error('Upload critical error:', error);

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
          notifications.show(
            t('notifications.uploadSuccess', { count: files.length }),
            { severity: 'success' }
          );
        } else if (successful.length === 0) {
          notifications.show(t('notifications.uploadAllFailed'), {
            severity: 'error',
          });
        } else {
          notifications.show(
            t('notifications.uploadPartialSuccess', {
              success: successful.length,
              total: files.length,
              failed: failed.length,
            }),
            { severity: 'warning', autoHideDuration: 6000 }
          );
        }
      } catch (error) {
        console.error('Upload critical error:', error);
      } finally {
        setTimeout(() => {
          setLoadingType(null);
        }, 500);
      }
    },
    [employeeId, notifications, useQueryClient, t]
  );

  const deleteMutation = useDeleteEmployeeAttachment();

  const handleDelete = async (
    attachment: Attachment,
    type: EmployeeAttachmentType
  ) => {
    if (!attachment.id) return;
    setLoadingType(type);

    try {
      await deleteMutation.mutateAsync({
        employeeId,
        path: attachment.path,
      });
    } finally {
      setLoadingType(null);
    }
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
