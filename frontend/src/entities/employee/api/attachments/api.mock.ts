import { mockDb } from '@/shared/api/mock/mockDb';
import { delay } from '@/shared/lib/delay';
import { FOLDER_NAMES, SYSTEM_FOLDER_PREFIX } from '@/shared/config/storage';
import type { Attachment, EmployeeAttachmentType } from '../../model/types';
import { mapStorageItemToAttachment } from '../mappers';

const getTypeFromFolder = (folderName: string) => {
  return folderName.replace(SYSTEM_FOLDER_PREFIX, '');
};

export const getEmployeeAttachments = async (
  employeeId: string
): Promise<Attachment[]> => {
  await delay();
  const employeesFolder = FOLDER_NAMES['employees'] || 'employees';
  const rootPrefix = `${employeesFolder}/${employeeId}/`;

  const employeeFiles = mockDb.storage.filter(
    (item) => item.path.startsWith(rootPrefix) && item.type === 'file'
  );

  const mapped = employeeFiles.map((file) => {
    const parts = file.path.split('/');
    const folderName = parts[parts.length - 2];
    const type = getTypeFromFolder(folderName) as EmployeeAttachmentType;

    const storageItem = {
      ...file,
      createdAt: new Date(file.createdAt),
    };

    return mapStorageItemToAttachment(storageItem, type, employeeId);
  });

  return mapped.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const uploadAttachment = async (
  employeeId: string,
  file: File,
  type: EmployeeAttachmentType,
  onProgress?: (progress: number) => void
): Promise<Attachment> => {
  if (onProgress) onProgress(10);
  await delay(300);
  if (onProgress) onProgress(50);
  await delay(300);

  const employeesFolder = FOLDER_NAMES['employees'] || 'employees';
  const subFolder = FOLDER_NAMES[type as string] || type;

  const uniqueName = `${Date.now()}_${file.name}`;
  const path = `${employeesFolder}/${employeeId}/${subFolder}/${uniqueName}`;
  const id = crypto.randomUUID();

  const newStorageItem = {
    id,
    name: uniqueName,
    path,
    size: file.size,
    contentType: file.type || 'application/octet-stream',
    type: 'file' as const,
    createdAt: new Date().toISOString(),
  };

  mockDb.storage.push(newStorageItem);

  if (onProgress) onProgress(100);

  return {
    id,
    employeeId,
    name: uniqueName,
    path,
    size: file.size,
    contentType: file.type,
    type: 'file',
    createdAt: new Date(newStorageItem.createdAt),
    attachmentType: getTypeFromFolder(subFolder) as EmployeeAttachmentType,
  };
};

export const deleteAttachment = async (filePath: string): Promise<void> => {
  await delay();
  mockDb.storage = mockDb.storage.filter((item) => item.path !== filePath);
};

export const getAttachmentUrl = (_path: string): string => {
  return `https://via.placeholder.com/150?text=${encodeURIComponent('Symulowany plik')}`;
};

export const getSignedAttachmentUrl = async (
  path: string
): Promise<string | null> => {
  await delay();
  return getAttachmentUrl(path);
};
