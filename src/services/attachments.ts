import { supabase } from '../supabase';
import {
  FOLDER_NAMES,
  SYSTEM_FOLDER_PREFIX,
  type Attachment,
  type EmployeeAttachmentType,
} from '../types';
import {
  listFiles,
  getUniqueDestPath,
  deleteFiles,
  getSignedUrl,
} from './storage';

const STORAGE_BUCKET = import.meta.env.VITE_FILES_BUCKET_NAME ?? 'files';

const getTypeFromFolder = (folderName: string) => {
  return folderName.replace(SYSTEM_FOLDER_PREFIX, '');
};

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
  const employeesFolder = FOLDER_NAMES['employees'];
  const rootPath = `${employeesFolder}/${employeeId}`;

  let typeFolders: any[] = [];
  try {
    typeFolders = await listFiles(rootPath);
  } catch {
    return [];
  }

  const allAttachments: Attachment[] = [];
  for (const folder of typeFolders) {
    if (folder.type !== 'folder') continue;

    const type = getTypeFromFolder(folder.name) as EmployeeAttachmentType;

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
  const employeesFolder = FOLDER_NAMES['employees'];
  const subFolder = FOLDER_NAMES[type as string] || type;

  const proposedPath = `${employeesFolder}/${employeeId}/${subFolder}/${file.name}`;

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
    attachmentType: getTypeFromFolder(subFolder) as EmployeeAttachmentType,
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
