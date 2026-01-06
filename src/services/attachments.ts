import { supabase } from '../supabase';
import type { Attachment, EmployeeAttachmentType } from '../types';
import {
  listFiles,
  getUniqueDestPath,
  deleteFiles,
  getSignedUrl,
} from './storage';

const STORAGE_BUCKET = 'files';

const mapStorageItemToAttachment = (
  item: any,
  type: EmployeeAttachmentType,
  employeeId: string
): Attachment => ({
  id: item.id || item.path,
  employeeId: employeeId,
  name: item.name,
  path: item.path,
  size: item.size,
  contentType: item.contentType,
  type: 'file',
  createdAt: item.createdAt,
  attachmentType: type,
});

export const getEmployeeAttachments = async (
  employeeId: string
): Promise<Attachment[]> => {
  const rootPath = `employees/${employeeId}`;

  let typeFolders: any[] = [];
  try {
    typeFolders = await listFiles(rootPath);
  } catch {
    return [];
  }

  const allAttachments: Attachment[] = [];
  for (const folder of typeFolders) {
    if (folder.type !== 'folder') continue;

    const type = folder.name as EmployeeAttachmentType;

    const filesInType = await listFiles(folder.path);

    const attachments = filesInType
      .filter((f) => f.type === 'file')
      .map((file) => mapStorageItemToAttachment(file, type, employeeId));

    allAttachments.push(...attachments);
  }

  return allAttachments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const uploadAttachment = async (
  employeeId: string,
  file: File,
  type: EmployeeAttachmentType,
  onProgress?: (progress: number) => void
): Promise<Attachment> => {
  const proposedPath = `employees/${employeeId}/${type}/${file.name}`;

  const uniquePath = await getUniqueDestPath(proposedPath);

  if (onProgress) onProgress(10);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(uniquePath, file, {
      upsert: false,
      cacheControl: '3600',
    });

  if (onProgress) onProgress(100);
  if (error) throw error;

  return {
    id: data?.id || uniquePath,
    employeeId,
    name: uniquePath.split('/').pop()!,
    path: uniquePath,
    size: file.size,
    contentType: file.type,
    type: 'file',
    createdAt: new Date(),
    attachmentType: type,
  };
};

export const deleteAttachment = async (filePath: string): Promise<void> => {
  await deleteFiles([filePath]);
};

export const getAttachmentUrl = (path: string): string => {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

export const getSignedAttachmentUrl = async (
  path: string
): Promise<string | null> => {
  return getSignedUrl(path);
};
