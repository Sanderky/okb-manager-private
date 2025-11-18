import { ref, deleteObject, getStorage, uploadBytes } from 'firebase/storage';
import { useCallback, useState } from 'react';
import type { Attachment, Employee, EmployeeAttachment } from '../../../types';

export type LoadingState = 'uploading' | 'deleting';

const storage = getStorage();

const useEmployeeAttachment = (employee: Employee | null | undefined) => {
  const [loading, setLoading] = useState<LoadingState | false>(false);

  const getAttachment = useCallback(
    (attachmentType: EmployeeAttachment) => {
      if (!employee || !attachmentType) return null;

      return employee[attachmentType];
    },
    [employee]
  );

  const handleUploadAttachment = useCallback(
    async (
      file: File | null,
      attachmentType: EmployeeAttachment
    ): Promise<Attachment | null> => {
      if (!file || !employee || !attachmentType) return null;

      setLoading('uploading');

      try {
        const storageRef = ref(
          storage,
          `employees/${employee.id}/${attachmentType}/${file.name}`
        );
        const snapshot = await uploadBytes(storageRef, file);

        const fileData: Attachment = {
          name: file.name,
          type: 'file' as const,
          fullPath: snapshot.ref.fullPath,
          contentType: file.type,
          size: file.size,
          timeCreated: snapshot.metadata.timeCreated,
          attachmentType: attachmentType,
        };

        return fileData;
      } catch (error) {
        console.error('Upload error:', error);
        throw new Error('Błąd podczas przesyłania pliku');
      } finally {
        setLoading(false);
      }
    },
    [employee]
  );

  const handleDeleteAttachment = useCallback(
    async (attachmentType: EmployeeAttachment) => {
      if (!attachmentType || !employee) {
        return false;
      }

      const file = employee[attachmentType];

      if (!file) return false;

      setLoading('deleting');
      try {
        const fileRef = ref(storage, file.fullPath);
        await deleteObject(fileRef);
        return true;
      } catch (error) {
        console.error('Delete file error:', error);
        throw new Error('Błąd podczas usuwania pliku');
      } finally {
        setLoading(false);
      }
    },
    [employee]
  );

  return {
    handleDeleteAttachment,
    handleUploadAttachment,
    getAttachment,
    loading,
  };
};

export default useEmployeeAttachment;
