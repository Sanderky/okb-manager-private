import { supabase } from '../supabase';
import type { FileBrowserItem } from '../types';
import { removePolishChars } from '../utils';

export const BUCKET_NAME = 'files';

export const getFileExtension = (filename: string): string | null => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex <= 0) return null;
  return filename.substring(lastDotIndex + 1).toLowerCase();
};

export const getFileNameWithoutExtension = (filename: string): string => {
  const lastSlashIndex = filename.lastIndexOf('/');
  const baseFilename =
    lastSlashIndex === -1 ? filename : filename.substring(lastSlashIndex + 1);
  const lastDotIndex = baseFilename.lastIndexOf('.');
  if (lastDotIndex <= 0) return baseFilename;
  return baseFilename.substring(0, lastDotIndex);
};

export const getFileType = (fileName: string) => {
  const extension = getFileExtension(fileName);
  if (!extension) return 'unsupported';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension))
    return 'image';
  if (extension === 'pdf') return 'pdf';
  if (['txt', 'md', 'js', 'css', 'html', 'json'].includes(extension))
    return 'text';
  if (['doc', 'docx'].includes(extension)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'excel';
  return 'unsupported';
};

export const canOpenPreview = (item: { type: string; name: string }) => {
  if (item.type === 'folder') return false;
  const fileType = getFileType(item.name);
  return fileType === 'image' || fileType === 'pdf';
};

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const listFiles = async (path: string): Promise<FileBrowserItem[]> => {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(path, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) throw error;

  const items: FileBrowserItem[] = [];

  data.forEach((item) => {
    if (item.name === '.placeholder' || item.name === '.emptyFolderPlaceholder')
      return;

    const fullPath = path ? `${path}/${item.name}` : item.name;

    if (!item.id) {
      items.push({
        name: item.name,
        type: 'folder',
        path: fullPath,
      });
    } else {
      items.push({
        id: item.id,
        name: item.name,
        type: 'file',
        path: fullPath,
        createdAt: item.created_at ? new Date(item.created_at) : new Date(),
        size: item.metadata?.size || 0,
        contentType: item.metadata?.mimetype || 'application/octet-stream',
      });
    }
  });
  return items;
};

export const getSignedUrl = async (
  fullPath: string,
  expiresIn = 60
): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(fullPath, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
  return data.signedUrl;
};

export const openFileInNewTab = async (
  path: string | undefined
): Promise<void> => {
  if (!path) {
    console.warn('Cannot open file: path is missing');
    return;
  }

  try {
    const signedUrl = await getSignedUrl(path);
    if (signedUrl) {
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error('Error opening file in new tab:', error);
  }
};

export const uploadFile = async (
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> => {
  if (onProgress) onProgress(10);

  const lastSlashIndex = path.lastIndexOf('/');
  const folder = lastSlashIndex !== -1 ? path.substring(0, lastSlashIndex) : '';
  const rawFileName =
    lastSlashIndex !== -1 ? path.substring(lastSlashIndex + 1) : path;

  const safeFileName = removePolishChars(rawFileName);

  const fullPath = folder ? `${folder}/${safeFileName}` : safeFileName;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fullPath, file, { upsert: false });

  if (onProgress) onProgress(100);

  if (error) throw error;
};

export const createFolder = async (path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(`${path}/.placeholder`, new Blob(['']), { upsert: false });

  if (error) throw error;
};

export const downloadFile = async (
  fullPath: string,
  fileName: string
): Promise<void> => {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
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
  destPath: string
): Promise<void> => {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .move(sourcePath, destPath);

  if (error) throw error;
};

const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const deleteFiles = async (paths: string[]): Promise<void> => {
  if (paths.length === 0) return;

  const batches = chunkArray(paths, 50);

  for (const batch of batches) {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove(batch);
    if (error) {
      console.error('Error deleting batch:', error);
      throw error;
    }
  }
};

export const deleteFolderRecursive = async (path: string): Promise<void> => {
  let keepFetching = true;

  while (keepFetching) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(path, {
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
  destPath: string
): Promise<void> => {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
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
  // 1. Rozdziel ścieżkę na katalog i nazwę pliku
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

export const downloadFileAsBlob = async (
  fullPath: string
): Promise<Blob | null> => {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(fullPath);

  if (error) {
    console.error(`Error downloading ${fullPath}:`, error);
    return null;
  }
  return data;
};
