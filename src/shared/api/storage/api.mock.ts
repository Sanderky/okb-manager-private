import { mockDb } from '@/shared/api/mock/mockDb';
import { delay } from '@/shared/lib/delay';
import {
  getFileExtension,
  getFileNameWithoutExtension,
} from '../../lib/fileUtils';
import { normalizeToEnglishAlphabet } from '../../lib/string';
import type { FileBrowserItem } from '../../model/types';
import { mapStorageItem } from './mappers';
import { STORAGE_BUCKET } from '../supabase';

export const BUCKET_NAME = STORAGE_BUCKET;

const getItemsInPath = (searchPath: string) => {
  const prefix = searchPath ? `${searchPath}/` : '';
  const results = new Map();

  mockDb.storage.forEach((item) => {
    if (item.path.startsWith(prefix)) {
      const relativePath = item.path.substring(prefix.length);
      const slashIndex = relativePath.indexOf('/');

      if (slashIndex === -1) {
        results.set(item.name, {
          id: item.id,
          name: item.name,
          created_at: item.createdAt,
          metadata: { size: item.size, mimetype: item.contentType },
        });
      } else {
        const folderName = relativePath.substring(0, slashIndex);
        if (!results.has(folderName)) {
          results.set(folderName, { name: folderName });
        }
      }
    }
  });

  return Array.from(results.values());
};

export const listFiles = async (
  path: string,
  _bucketName: string = BUCKET_NAME
): Promise<FileBrowserItem[]> => {
  await delay();
  const rawItems = getItemsInPath(path);

  return rawItems
    .filter(
      (item) =>
        item.name !== '.placeholder' && item.name !== '.emptyFolderPlaceholder'
    )
    .map((item) => mapStorageItem(item, path));
};

// export const getSignedUrl = async (
//   fullPath: string,
//   expiresIn = 60,
//   bucketName: string = BUCKET_NAME
// ): Promise<string> => {
//   await delay();
//   return `https://mock-storage.local/${bucketName}/${fullPath}`;
// };

export const getSignedUrl = async (
  fullPath: string,
  _expiresIn = 60,
  _bucketName: string = BUCKET_NAME
): Promise<string> => {
  await delay();

  const fileName = fullPath.split('/').pop() || 'Brak nazwy';
  const isImage = fileName.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);

  if (isImage) {
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
        <rect width="100%" height="100%" fill="#000000"/>
        <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#ffffff" font-weight="bold">
          Wersja demo
        </text>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#ffffff">
          ${fileName}
        </text>
        <text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#ffffff">
          Podgląd plików jest niemożliwy.
        </text>
      </svg>
    `.trim();
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
  }

  // const blob = new Blob(
  //   [
  //     `Wersja demo\n\n\n${fileName}\n\nPodgląd plików jest niemożliwy`,
  //   ],
  //   { type: 'text/plain' }
  // );

  const htmlContent = `
  <div style="font-family: sans-serif; text-align: center; padding: 40px; background-color: #ffffff">
    <h2 style="color: #000;">Wersja demo</h2>
    <p style="font-size: 18px; font-weight: bold; color: #000;">${fileName}</p>
    <p style="color: #000; margin-top: 20px;">Podgląd plików jest niemożliwy.</p>
  </div>
`;

  const blob = new Blob([htmlContent], { type: 'text/html' });

  return URL.createObjectURL(blob);
};

export const downloadFileAsBlob = async (
  _fullPath: string,
  _bucketName: string = BUCKET_NAME
): Promise<Blob> => {
  await delay();
  return new Blob(['Symulowana zawartość pliku offline'], {
    type: 'text/plain',
  });
};

export const uploadFile = async (
  path: string,
  file: File,
  onProgress?: (progress: number) => void,
  _bucketName: string = BUCKET_NAME,
  upsert: boolean = false
): Promise<void> => {
  if (onProgress) onProgress(10);
  await delay(300);
  if (onProgress) onProgress(50);

  const lastSlashIndex = path.lastIndexOf('/');
  const folder = lastSlashIndex !== -1 ? path.substring(0, lastSlashIndex) : '';
  const rawFileName =
    lastSlashIndex !== -1 ? path.substring(lastSlashIndex + 1) : path;
  const safeFileName = normalizeToEnglishAlphabet(rawFileName);
  const fullPath = folder ? `${folder}/${safeFileName}` : safeFileName;

  if (upsert) {
    mockDb.storage = mockDb.storage.filter((i) => i.path !== fullPath);
  } else {
    if (mockDb.storage.some((i) => i.path === fullPath)) {
      throw new Error('Plik już istnieje (upsert: false)');
    }
  }

  mockDb.storage.push({
    id: crypto.randomUUID(),
    name: safeFileName,
    path: fullPath,
    size: file.size,
    contentType: file.type || 'application/octet-stream',
    type: 'file',
    createdAt: new Date().toISOString(),
  });

  await delay(200);
  if (onProgress) onProgress(100);
};

export const createFolder = async (
  path: string,
  _bucketName: string = BUCKET_NAME
): Promise<void> => {
  await delay();
  mockDb.storage.push({
    id: crypto.randomUUID(),
    name: '.placeholder',
    path: `${path}/.placeholder`,
    size: 0,
    contentType: 'text/plain',
    type: 'file',
    createdAt: new Date().toISOString(),
  });
};

export const downloadFile = async (
  _fullPath: string,
  fileName: string,
  _bucketName: string = BUCKET_NAME
): Promise<void> => {
  await delay();
  const blob = new Blob(['Symulowana zawartość dla: ' + fileName]);
  const blobUrl = window.URL.createObjectURL(blob);
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
  _bucketName: string = BUCKET_NAME
): Promise<void> => {
  await delay();
  const item = mockDb.storage.find((i) => i.path === sourcePath);
  if (!item) throw new Error('Plik źródłowy nie istnieje');

  item.path = destPath;
  item.name = destPath.split('/').pop()!;
};

export const deleteFiles = async (
  paths: string[],
  _bucketName: string = BUCKET_NAME
): Promise<void> => {
  await delay();
  const pathSet = new Set(paths);
  mockDb.storage = mockDb.storage.filter((i) => !pathSet.has(i.path));
};

export const deleteFolderRecursive = async (
  path: string,
  _bucketName: string = BUCKET_NAME
): Promise<void> => {
  await delay();
  const prefix = `${path}/`;
  mockDb.storage = mockDb.storage.filter(
    (i) => !i.path.startsWith(prefix) && i.path !== path
  );
};

export const moveFolderRecursive = async (
  sourcePath: string,
  destPath: string,
  _bucketName: string = BUCKET_NAME
): Promise<void> => {
  await delay();
  const prefix = `${sourcePath}/`;

  mockDb.storage.forEach((item) => {
    if (item.path.startsWith(prefix)) {
      item.path = item.path.replace(sourcePath, destPath);
    } else if (item.path === sourcePath) {
      item.path = destPath;
    }
  });
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
  const safeFileName = normalizeToEnglishAlphabet(rawFileName);

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
