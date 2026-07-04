import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDialogs } from '@/shared/ui/dialogs/useDialogs';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { normalizeToEnglishAlphabet } from '@/shared/lib/string';
import type { FileBrowserItem } from '@/shared/model/types';
import {
  FOLDER_TRANSLATIONS,
  SYSTEM_FOLDER_PREFIX,
} from '@/shared/config/storage';
import * as FilesApi from '@/shared/api/storage';
import {
  getFileExtension,
  getFileNameWithoutExtension,
} from '@/shared/lib/fileUtils';

export const EMPTY_MAP = {};

const useFileBrowser = (
  baseDirectory: string,
  onFetch: () => void,
  employeesMap: Record<string, string> = EMPTY_MAP,
  constructionsMap: Record<string, string> = EMPTY_MAP
) => {
  const { t } = useTranslation(['fileBrowser', 'common']);

  const [rawItems, setRawItems] = useState<FileBrowserItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(baseDirectory);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );

  const data = useMemo(() => {
    return rawItems.map((item) => {
      if (FOLDER_TRANSLATIONS[item.name]) {
        return {
          ...item,
          isSystem: true,
        };
      }

      if (employeesMap[item.name])
        return { ...item, name: employeesMap[item.name], isSystem: true };
      if (constructionsMap[item.name])
        return { ...item, name: constructionsMap[item.name], isSystem: true };

      return item;
    });
  }, [rawItems, employeesMap, constructionsMap]);

  const dialogs = useDialogs();
  const notifications = useNotifications();

  const [itemsToMove, setItemsToMove] = useState<FileBrowserItem[]>([]);
  const [destinationFolders, setDestinationFolders] = useState<
    Array<{ name: string; path: string }>
  >([]);
  const [moveDialogOpen, setMoveDialogOpen] = useState<boolean>(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);

  const fetchData = useCallback(
    async (path: string) => {
      setLoading(true);
      onFetch();
      try {
        const items = await FilesApi.listFiles(path);
        setRawItems(items);
      } catch (error) {
        console.error('Fetch error:', error);
        notifications.show(t('notifications.fetchError'), {
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
    [onFetch, notifications, t]
  );

  useEffect(() => {
    fetchData(currentPath);
  }, [currentPath, fetchData]);

  const handleDownload = useCallback(
    async (items: FileBrowserItem[]) => {
      if (items.length === 0) return;

      if (items.length === 1 && items[0].type === 'file') {
        try {
          await FilesApi.downloadFile(items[0].path, items[0].name);
        } catch {
          notifications.show(t('notifications.downloadError'), {
            severity: 'error',
          });
        }
        return;
      }

      setLoading(true);
      const zip = new JSZip();
      let count = 0;

      try {
        const processItem = async (
          item: FileBrowserItem,
          currentZipFolder: JSZip
        ) => {
          if (item.type === 'file') {
            const blob = await FilesApi.downloadFileAsBlob(item.path);
            if (blob) {
              currentZipFolder.file(item.name, blob);
              count++;
            }
          } else {
            const newZipFolder = currentZipFolder.folder(item.name);
            if (newZipFolder) {
              const subItems = await FilesApi.listFiles(item.path);
              for (const subItem of subItems) {
                await processItem(subItem, newZipFolder);
              }
            }
          }
        };

        for (const item of items) {
          await processItem(item, zip);
        }

        if (count === 0) {
          notifications.show(t('notifications.noFilesToZip'), {
            severity: 'warning',
          });
          return;
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const prefix = t('filePrefix');
        saveAs(
          content,
          `${prefix}_${new Date().toISOString().slice(0, 10)}.zip`
        );
      } catch (error) {
        console.error('ZIP Error:', error);
        notifications.show(t('notifications.zipError'), { severity: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [notifications, t]
  );

  const handleCreateFolder = useCallback(async () => {
    const folderName = await dialogs.prompt(t('dialogs.newFolderPrompt'), {
      title: t('dialogs.newFolderTitle'),
      okText: t('dialogs.buttons.create'),
      cancelText: t('common:buttons.cancel'),
    });

    if (!folderName) return;

    if (folderName.toLowerCase().startsWith(SYSTEM_FOLDER_PREFIX)) {
      notifications.show(t('notifications.systemReserved'), {
        severity: 'warning',
      });
      return;
    }

    if (data.some((i) => i.name === folderName && i.type === 'folder')) {
      notifications.show(t('notifications.folderExists'), {
        severity: 'error',
      });
      return;
    }

    try {
      const cleanFolderName = normalizeToEnglishAlphabet(folderName);
      const path = currentPath
        ? `${currentPath}/${cleanFolderName}`
        : cleanFolderName;
      await FilesApi.createFolder(path);
      await fetchData(currentPath);
      notifications.show(t('notifications.folderCreated'), {
        severity: 'success',
      });
    } catch {
      notifications.show(t('notifications.folderCreateError'), {
        severity: 'error',
      });
    }
  }, [data, currentPath, dialogs, notifications, fetchData, t]);

  const handleDelete = useCallback(
    async (items: FileBrowserItem[]) => {
      const itemsToDelete = items.filter((i) => !i.isSystem);
      const systemFilesCount = items.length - itemsToDelete.length;

      if (itemsToDelete.length === 0) {
        notifications.show(t('notifications.systemDeleteError'), {
          severity: 'warning',
        });
        return;
      }

      let confirmMessage = t('dialogs.deleteConfirm', {
        count: itemsToDelete.length,
      });
      if (systemFilesCount > 0) {
        confirmMessage += t('dialogs.skippedSystem', {
          count: systemFilesCount,
        });
      }

      if (
        !(await dialogs.confirm(confirmMessage, {
          title: t('dialogs.deleteTitle'),
          severity: 'error',
          okText: t('common:buttons.delete'),
          cancelText: t('common:buttons.cancel'),
        }))
      )
        return;

      try {
        const files = itemsToDelete
          .filter((i) => i.type === 'file')
          .map((i) => i.path);
        if (files.length > 0) await FilesApi.deleteFiles(files);

        const folders = itemsToDelete.filter((i) => i.type === 'folder');
        await Promise.all(
          folders.map((f) => FilesApi.deleteFolderRecursive(f.path))
        );

        await fetchData(currentPath);
        notifications.show(t('notifications.deleted'), { severity: 'success' });
      } catch {
        notifications.show(t('notifications.deleteError'), {
          severity: 'error',
        });
      }
    },
    [dialogs, fetchData, currentPath, notifications, t]
  );

  const handleRename = useCallback(
    async (item: FileBrowserItem) => {
      if (item.isSystem) {
        notifications.show(t('notifications.systemRenameError'), {
          severity: 'warning',
        });
        return;
      }
      const isFile = item.type === 'file';
      const defaultValue = isFile
        ? getFileNameWithoutExtension(item.name)
        : item.name;
      const title = isFile
        ? t('dialogs.renameFileTitle')
        : t('dialogs.renameFolderTitle');

      let newName = await dialogs.prompt(t('dialogs.renamePrompt'), {
        title,
        defaultValue,
        okText: t('dialogs.buttons.change'),
      });

      if (!newName || newName === defaultValue) return;

      if (isFile) {
        const ext = getFileExtension(item.name);
        if (ext) newName += `.${ext}`;
      }

      if (data.some((i) => i.name === newName)) {
        notifications.show(t('notifications.nameExists'), {
          severity: 'error',
        });
        return;
      }

      setLoading(true);
      try {
        const newPath = currentPath ? `${currentPath}/${newName}` : newName;
        if (isFile) {
          await FilesApi.moveFile(item.path, newPath);
        } else {
          await FilesApi.moveFolderRecursive(item.path, newPath);
        }
        await fetchData(currentPath);
        notifications.show(t('notifications.renamed'), { severity: 'success' });
      } catch {
        notifications.show(t('notifications.renameError'), {
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
    [data, currentPath, dialogs, notifications, fetchData, t]
  );

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setIsUploadDialogOpen(true);
      setUploadProgress({});
      setLoading(true);
      setUploading(true);
      for (const file of files) {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
      }

      const uploadPromises = Array.from(files).map(async (file) => {
        const finalName = file.name;
        const proposedPath = currentPath
          ? `${currentPath}/${finalName}`
          : finalName;

        try {
          const uniquePath = await FilesApi.getUniqueDestPath(proposedPath);

          await FilesApi.uploadFile(uniquePath, file, (prog) => {
            setUploadProgress((prev) => ({ ...prev, [file.name]: prog }));
          });

          return file.name;
        } catch {
          setUploadProgress((prev) => ({ ...prev, [file.name]: -1 }));
          throw new Error(`File ${file.name} error`);
        }
      });

      try {
        const results = await Promise.allSettled(uploadPromises);

        const successful = results.filter((r) => r.status === 'fulfilled');
        const failed = results.filter((r) => r.status === 'rejected');

        if (successful.length > 0) {
          await fetchData(currentPath);
        }

        if (failed.length === 0) {
          notifications.show(
            t('notifications.uploadSuccess', { count: files.length }),
            {
              severity: 'success',
            }
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
        console.error('Krytyczny błąd uploadu:', error);
        notifications.show(t('notifications.unexpectedError'), {
          severity: 'error',
        });
      } finally {
        setLoading(false);
        setUploading(false);
        event.target.value = '';
      }
    },
    [currentPath, fetchData, notifications, t]
  );

  const openMoveDialog = useCallback(
    (items: FileBrowserItem[]) => {
      const movableItems = items.filter((i) => !i.isSystem);

      if (movableItems.length === 0) {
        notifications.show(t('notifications.systemMoveError'), {
          severity: 'warning',
        });
        return;
      }

      if (movableItems.length < items.length) {
        notifications.show(
          t('notifications.skippedSystemFiles', {
            count: items.length - movableItems.length,
          }),
          { severity: 'info' }
        );
      }

      setItemsToMove(movableItems);

      const options: Array<{ name: string; path: string }> = [];

      if (currentPath !== baseDirectory) {
        const lastSlashIndex = currentPath.lastIndexOf('/');
        const parentPath =
          lastSlashIndex !== -1
            ? currentPath.substring(0, lastSlashIndex)
            : baseDirectory;

        options.push({
          name: '..',
          path: parentPath,
        });
      }

      const movingItemNames = items.map((i) => i.name);

      const subFolders = data
        .filter((item) => item.type === 'folder')
        .filter((folder) => !movingItemNames.includes(folder.name))
        .map((folder) => ({
          name: folder.name,
          path: folder.path,
        }));

      options.push(...subFolders);

      setDestinationFolders(options);
      setMoveDialogOpen(true);
    },
    [currentPath, baseDirectory, data, notifications, t]
  );

  const handleMove = useCallback(
    async (destPath: string) => {
      setLoading(true);
      try {
        for (const item of itemsToMove) {
          const targetPath = destPath ? `${destPath}/${item.name}` : item.name;

          if (item.type === 'file') {
            const uniquePath = await FilesApi.getUniqueDestPath(targetPath);
            await FilesApi.moveFile(item.path, uniquePath);
          } else {
            await FilesApi.moveFolderRecursive(item.path, targetPath);
          }
        }

        await fetchData(currentPath);
        notifications.show(t('notifications.moveSuccess'), {
          severity: 'success',
        });
      } catch (e) {
        console.error(e);
        notifications.show(t('notifications.moveError'), { severity: 'error' });
      } finally {
        setLoading(false);
        setMoveDialogOpen(false);
        setItemsToMove([]);
      }
    },
    [itemsToMove, currentPath, fetchData, notifications, t]
  );

  return {
    loading,
    data,
    currentPath,
    changeCurrentPath: setCurrentPath,
    handleDownload,
    handleCreateFolder,
    handleDelete,
    handleRename,
    handleFileUpload,
    moveDialogOpen,
    closeMoveDialog: () => setMoveDialogOpen(false),
    openMoveDialog,
    destinationFolders,
    handleMove,
    isUploadDialogOpen,
    setIsUploadDialogOpen,
    uploadProgress,
    uploading,
  };
};

export default useFileBrowser;
