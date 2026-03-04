import { chunkArray, getFileExtension, getFileNameWithoutExtension } from '../lib/fileUtils';
import { removePolishChars } from '../lib/string';
import type { FileBrowserItem } from '../model/types';
import { mapStorageItem } from './mappers';
import { supabase } from './supabase';

export const BUCKET_NAME = import.meta.env.VITE_FILES_BUCKET_NAME ?? 'files';

export const listFiles = async (path: string, bucketName: string = BUCKET_NAME): Promise<FileBrowserItem[]> => {
  const { data, error } = await supabase.storage.from(bucketName).list(path, { limit: 100 });
  if (error) throw error;

  return data
    .filter((item) => item.name !== '.placeholder' && item.name !== '.emptyFolderPlaceholder')
    .map((item) => mapStorageItem(item, path));
};

export const getSignedUrl = async (fullPath: string, expiresIn = 60, bucketName: string = BUCKET_NAME): Promise<string> => {
  const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(fullPath, expiresIn);
  if (error) throw error; 
  return data.signedUrl;
};

export const downloadFileAsBlob = async (fullPath: string, bucketName: string = BUCKET_NAME): Promise<Blob> => {
  const { data, error } = await supabase.storage.from(bucketName).download(fullPath);
  if (error) throw error;
  return data;
};

export const uploadFile = async (
  path: string,
  file: File,
  onProgress?: (progress: number) => void,
  bucketName: string = BUCKET_NAME,
  upsert: boolean = false
): Promise<void> => {
  if (onProgress) onProgress(10);

  const lastSlashIndex = path.lastIndexOf('/');
  const folder = lastSlashIndex !== -1 ? path.substring(0, lastSlashIndex) : '';
  const rawFileName =
    lastSlashIndex !== -1 ? path.substring(lastSlashIndex + 1) : path;

  const safeFileName = removePolishChars(rawFileName);

  const fullPath = folder ? `${folder}/${safeFileName}` : safeFileName;

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(fullPath, file, { upsert: upsert });

  if (onProgress) onProgress(100);

  if (error) throw error;
};

export const createFolder = async (
  path: string,
  bucketName: string = BUCKET_NAME
): Promise<void> => {
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(`${path}/.placeholder`, new Blob(['']), { upsert: false });

  if (error) throw error;
};

export const downloadFile = async (
  fullPath: string,
  fileName: string,
  bucketName: string = BUCKET_NAME
): Promise<void> => {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(fullPath);

  if (error) throw error;

  const blobUrl = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export const moveFile = async (
  sourcePath: string,
  destPath: string,
  bucketName: string = BUCKET_NAME
): Promise<void> => {
  const { error } = await supabase.storage
    .from(bucketName)
    .move(sourcePath, destPath);

  if (error) throw error;
};

export const deleteFiles = async (
  paths: string[],
  bucketName: string = BUCKET_NAME
): Promise<void> => {
  if (paths.length === 0) return;

  const batches = chunkArray(paths, 50);

  for (const batch of batches) {
    const { error } = await supabase.storage.from(bucketName).remove(batch);
    if (error) {
      console.error('Error deleting batch:', error);
      throw error;
    }
  }
};

export const deleteFolderRecursive = async (
  path: string,
  bucketName: string = BUCKET_NAME
): Promise<void> => {
  let keepFetching = true;

  while (keepFetching) {
    const { data, error } = await supabase.storage.from(bucketName).list(path, {
      limit: 100,
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      keepFetching = false;
      break;
    }

    const filesToDelete: string[] = [];
    const folderPromises: Promise<void>[] = [];

    for (const item of data) {
      if (item.id) {
        filesToDelete.push(`${path}/${item.name}`);
      } else {
        folderPromises.push(deleteFolderRecursive(`${path}/${item.name}`));
      }
    }

    if (filesToDelete.length > 0) {
      await deleteFiles(filesToDelete);
    }

    if (folderPromises.length > 0) {
      await Promise.all(folderPromises);
    }
  }
};

export const moveFolderRecursive = async (
  sourcePath: string,
  destPath: string,
  bucketName: string = BUCKET_NAME
): Promise<void> => {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .list(sourcePath);

  if (error) throw error;

  const moveOperations = data.map(async (item) => {
    const currentItemSource = `${sourcePath}/${item.name}`;
    const currentItemDest = destPath ? `${destPath}/${item.name}` : item.name;

    if (item.id) {
      return moveFile(currentItemSource, currentItemDest);
    } else {
      return moveFolderRecursive(currentItemSource, currentItemDest);
    }
  });

  await Promise.all(moveOperations);
};

export const listAllFoldersRecursive = async (
  path: string
): Promise<Array<{ name: string; fullPath: string }>> => {
  const items = await listFiles(path);
  let folders: Array<{ name: string; fullPath: string }> = [];

  for (const item of items) {
    if (item.type === 'folder') {
      folders.push({ name: item.name, fullPath: item.path });
      const subFolders = await listAllFoldersRecursive(item.path);
      folders = folders.concat(subFolders);
    }
  }
  return folders;
};

export const getUniqueDestPath = async (
  proposedPath: string
): Promise<string> => {
  const lastSlash = proposedPath.lastIndexOf('/');
  const pathDirectory =
    lastSlash !== -1 ? proposedPath.substring(0, lastSlash + 1) : '';
  const rawFileName =
    lastSlash !== -1 ? proposedPath.substring(lastSlash + 1) : proposedPath;

  const safeFileName = removePolishChars(rawFileName);

  let uniquePath = pathDirectory
    ? `${pathDirectory}${safeFileName}`
    : safeFileName;

  let counter = 1;
  const extension = getFileExtension(safeFileName);
  const originalNameWithoutExtension =
    getFileNameWithoutExtension(safeFileName);

  const itemsInDir = await listFiles(pathDirectory);
  const existingNames = new Set(itemsInDir.map((i) => i.name));

  while (existingNames.has(uniquePath.split('/').pop()!)) {
    uniquePath = `${pathDirectory}${originalNameWithoutExtension} (${counter})${extension ? '.' + extension : ''}`;
    counter++;
  }

  return uniquePath;
};