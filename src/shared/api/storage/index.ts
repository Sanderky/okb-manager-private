import * as supabaseApi from './api';
import * as mockApi from './api.mock';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const {
  listFiles,
  getSignedUrl,
  downloadFileAsBlob,
  uploadFile,
  createFolder,
  downloadFile,
  moveFile,
  deleteFiles,
  deleteFolderRecursive,
  moveFolderRecursive,
  listAllFoldersRecursive,
  getUniqueDestPath,
  getRodoFilePublicUrl
} = isMock ? mockApi : supabaseApi;
