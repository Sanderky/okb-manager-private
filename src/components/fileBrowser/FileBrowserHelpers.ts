import { FirebaseError } from 'firebase/app';
import {
  ref,
  getMetadata,
  uploadBytes,
  deleteObject,
  listAll,
  getStorage,
  getBlob,
} from 'firebase/storage';
import type { FileCustom } from '../../types';

const storage = getStorage();

export const getFileType = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return 'unsupported';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
    return 'image';
  }
  if (extension === 'pdf') {
    return 'pdf';
  }
  if (['txt', 'md', 'js', 'css', 'html', 'json'].includes(extension)) {
    return 'text';
  }
  if (['doc', 'docx'].includes(extension)) {
    return 'word';
  }
  return 'unsupported';
};

export const forceDownloadFile = async (fullPath: string, fileName: string) => {
  try {
    const fileRef = ref(storage, fullPath);

    const blob = await getBlob(fileRef);

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    if (link.parentNode) link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};
export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getFileNameWithoutExtension(filename: string): string {
  const lastSlashIndex = filename.lastIndexOf('/');
  const baseFilename =
    lastSlashIndex === -1 ? filename : filename.substring(lastSlashIndex + 1);
  const lastDotIndex = baseFilename.lastIndexOf('.');
  if (lastDotIndex <= 0) return baseFilename;
  return baseFilename.substring(0, lastDotIndex);
}

export function getFileExtension(filename: string): string | null {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex <= 0) return null;
  return filename.substring(lastDotIndex + 1).toLowerCase();
}

export const getUniqueDestPath = async (
  proposedPath: string
): Promise<string> => {
  let uniquePath = proposedPath;
  let counter = 1;
  const extension = getFileExtension(proposedPath);
  const originalNameWithoutExtension =
    getFileNameWithoutExtension(proposedPath);
  const pathDirectory = proposedPath.substring(
    0,
    proposedPath.lastIndexOf('/') + 1
  );

  while (true) {
    try {
      const pathRef = ref(storage, uniquePath);
      await getMetadata(pathRef);
      uniquePath = `${pathDirectory}${originalNameWithoutExtension} (${counter})${extension ? extension : ''}`;
      counter++;
    } catch (error) {
      if (
        error instanceof FirebaseError &&
        error.code === 'storage/object-not-found'
      ) {
        return uniquePath;
      }
      throw error;
    }
  }
};

export const moveFile = async (
  sourcePath: string,
  destPath: string
): Promise<void> => {
  try {
    const oldRef = ref(storage, sourcePath);
    const newRef = ref(storage, destPath);

    const blob = await getBlob(oldRef);

    await uploadBytes(newRef, blob);

    await deleteObject(oldRef);
  } catch (e) {
    console.error('Error moving file:', e);
    throw e;
  }
};

export const deleteFolderRecursive = async (path: string): Promise<void> => {
  const listRef = ref(storage, path);
  const res = await listAll(listRef);
  await Promise.all(res.items.map((itemRef) => deleteObject(itemRef)));
  await Promise.all(
    res.prefixes.map((folderRef) => deleteFolderRecursive(folderRef.fullPath))
  );
};

export const moveFolderRecursive = async (
  sourcePath: string,
  destPath: string
): Promise<void> => {
  const listRef = ref(storage, sourcePath);
  const res = await listAll(listRef);

  const placeholderFile = res.items.find(
    (item) => item.name === '.placeholder'
  );
  const contentFiles = res.items.filter((item) => item.name !== '.placeholder');

  const moveContentPromises = [
    ...contentFiles.map(async (item) => {
      const proposedDestPath = `${destPath}/${item.name}`;
      const uniqueDestPath = await getUniqueDestPath(proposedDestPath);
      return moveFile(item.fullPath, uniqueDestPath);
    }),
    ...res.prefixes.map((folder) =>
      moveFolderRecursive(folder.fullPath, `${destPath}/${folder.name}`)
    ),
  ];

  await Promise.all(moveContentPromises);

  if (placeholderFile) {
    await moveFile(placeholderFile.fullPath, `${destPath}/.placeholder`);
  }
};

export const canOpenPreview = (item: FileCustom) => {
  if (item.type === 'folder') return false;
  const fileType = getFileType(item.name);
  if (fileType !== 'image' && fileType !== 'pdf') return false;
  return true;
};

export const listAllFoldersRecursive = async (
  path: string
): Promise<Array<{ name: string; fullPath: string }>> => {
  const listRef = ref(storage, path);
  const res = await listAll(listRef);
  const folders = res.prefixes.map((folderRef) => ({
    name: folderRef.name,
    fullPath: folderRef.fullPath,
  }));
  const subfolderPromises = res.prefixes.map((folderRef) =>
    listAllFoldersRecursive(folderRef.fullPath)
  );
  const nestedFolders = await Promise.all(subfolderPromises);
  return folders.concat(...nestedFolders);
};
