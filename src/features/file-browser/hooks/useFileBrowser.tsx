import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDialogs } from '../../../hooks/useDialogs/useDialogs';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import * as FilesApi from '../../../entities/files/model/api';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { removePolishChars } from '../../../utils';
import { FOLDER_TRANSLATIONS, SYSTEM_FOLDER_PREFIX, type FileBrowserItem } from '../../../entities/files';

export const EMPTY_MAP = {};

const useFileBrowser = (
  baseDirectory: string,
  onFetch: () => void,
  employeesMap: Record<string, string> = EMPTY_MAP,
  constructionsMap: Record<string, string> = EMPTY_MAP
) => {
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
          name: FOLDER_TRANSLATIONS[item.name],
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
        notifications.show('Błąd podczas ładowania plików!', {
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
    [onFetch, notifications]
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
        } catch (e) {
          notifications.show('Błąd pobierania pliku', { severity: 'error' });
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
          notifications.show('Nie znaleziono plików do spakowania.', {
            severity: 'warning',
          });
          return;
        }

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(
          content,
          `pliki_okb_manager_${new Date().toISOString().slice(0, 10)}.zip`
        );
      } catch (error) {
        console.error('ZIP Error:', error);
        notifications.show('Błąd podczas tworzenia archiwum ZIP.', {
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
    [notifications]
  );

  const handleCreateFolder = useCallback(async () => {
    const folderName = await dialogs.prompt(`Podaj nazwę nowego folderu:`, {
      title: `Nowy folder`,
      okText: 'Utwórz',
      cancelText: 'Anuluj',
    });

    if (!folderName) return;

    if (folderName.toLowerCase().startsWith(SYSTEM_FOLDER_PREFIX)) {
      notifications.show(
        'Nazwy rozpoczynające się od "system-" są zastrzeżone dla systemu',
        { severity: 'warning' }
      );
      return;
    }

    if (data.some((i) => i.name === folderName && i.type === 'folder')) {
      notifications.show('Taki folder już istnieje!', { severity: 'error' });
      return;
    }

    try {
      const cleanFolderName = removePolishChars(folderName);
      const path = currentPath
        ? `${currentPath}/${cleanFolderName}`
        : cleanFolderName;
      await FilesApi.createFolder(path);
      await fetchData(currentPath);
      notifications.show('Folder został utworzony', { severity: 'success' });
    } catch (error) {
      notifications.show('Błąd podczas tworzenia folderu', {
        severity: 'error',
      });
    }
  }, [data, currentPath, dialogs, notifications, fetchData]);

  const handleDelete = useCallback(
    async (items: FileBrowserItem[]) => {
      const itemsToDelete = items.filter((i) => !i.isSystem);
      const systemFilesCount = items.length - itemsToDelete.length;

      if (itemsToDelete.length === 0) {
        notifications.show('Nie można usuwać plików systemowych.', {
          severity: 'warning',
        });
        return;
      }

      let confirmMessage = `Czy na pewno usunąć ${itemsToDelete.length} element(ów)?`;
      if (systemFilesCount > 0) {
        confirmMessage += ` (Pominięto ${systemFilesCount} plików systemowych)`;
      }

      if (
        !(await dialogs.confirm(confirmMessage, {
          title: 'Usuwanie plików',
          severity: 'error',
          okText: 'Usuń',
          cancelText: 'Anuluj',
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
        notifications.show('Pliki zostały usunięte.', { severity: 'success' });
      } catch (error) {
        notifications.show('Błąd podczas usuwania.', { severity: 'error' });
      }
    },
    [dialogs, fetchData, currentPath, notifications]
  );

  const handleRename = useCallback(
    async (item: FileBrowserItem) => {
      if (item.isSystem) {
        notifications.show('Nie można zmieniać nazwy plików systemowych.', {
          severity: 'warning',
        });
        return;
      }
      const isFile = item.type === 'file';
      const defaultValue = isFile
        ? FilesApi.getFileNameWithoutExtension(item.name)
        : item.name;
      const title = isFile ? 'Zmień nazwę pliku' : 'Zmień nazwę folderu';

      let newName = await dialogs.prompt('Podaj nową nazwę:', {
        title,
        defaultValue,
        okText: 'Zmień',
      });
      if (!newName || newName === defaultValue) return;

      if (isFile) {
        const ext = FilesApi.getFileExtension(item.name);
        if (ext) newName += `.${ext}`;
      }

      if (data.some((i) => i.name === newName)) {
        notifications.show('Taka nazwa już istnieje.', { severity: 'error' });
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
        notifications.show('Nazwa została zmieniona.', { severity: 'success' });
      } catch (error) {
        notifications.show('Błąd podczas zmiany nazwy.', { severity: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [data, currentPath, dialogs, notifications, fetchData]
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
          const uniquePath =
            await FilesApi.getUniqueDestPath(proposedPath);

          await FilesApi.uploadFile(uniquePath, file, (prog) => {
            setUploadProgress((prev) => ({ ...prev, [file.name]: prog }));
          });

          return file.name;
        } catch (error) {
          setUploadProgress((prev) => ({ ...prev, [file.name]: -1 }));
          throw new Error(`Błąd pliku ${file.name}`);
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
          notifications.show(`Przesłano pomyślnie ${files.length} plików`, {
            severity: 'success',
          });
        } else if (successful.length === 0) {
          notifications.show(
            'Wszystkie pliki napotkały błąd podczas wysyłania.',
            {
              severity: 'error',
            }
          );
        } else {
          notifications.show(
            `Przesłano ${successful.length} z ${files.length} plików. Błędy: ${failed.length}`,
            { severity: 'warning', autoHideDuration: 6000 }
          );
        }
      } catch (error) {
        console.error('Krytyczny błąd uploadu:', error);
        notifications.show('Wystąpił nieoczekiwany błąd.', {
          severity: 'error',
        });
      } finally {
        // setTimeout(() => {
        //   setIsUploadDialogOpen(false);
        //   setUploadProgress({});
        // }, 500);
        setLoading(false);
        setUploading(false);

        event.target.value = '';
      }
    },
    [currentPath, fetchData, notifications]
  );

  const openMoveDialog = useCallback(
    (items: FileBrowserItem[]) => {
      const movableItems = items.filter((i) => !i.isSystem);

      if (movableItems.length === 0) {
        notifications.show('Nie można przenosić plików systemowych.', {
          severity: 'warning',
        });
        return;
      }

      if (movableItems.length < items.length) {
        notifications.show(
          `Pominięto ${items.length - movableItems.length} plików systemowych.`,
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
    [currentPath, baseDirectory, data, notifications]
  );

  const handleMove = useCallback(
    async (destPath: string) => {
      setLoading(true);
      try {
        for (const item of itemsToMove) {
          const targetPath = destPath ? `${destPath}/${item.name}` : item.name;

          if (item.type === 'file') {
            const uniquePath =
              await FilesApi.getUniqueDestPath(targetPath);
            await FilesApi.moveFile(item.path, uniquePath);
          } else {
            await FilesApi.moveFolderRecursive(item.path, targetPath);
          }
        }

        await fetchData(currentPath);
        notifications.show('Pomyślnie przeniesiono pliki.', {
          severity: 'success',
        });
      } catch (e) {
        console.error(e);
        notifications.show('Błąd pdoczas przenoszenia.', { severity: 'error' });
      } finally {
        setLoading(false);
        setMoveDialogOpen(false);
        setItemsToMove([]);
      }
    },
    [itemsToMove, currentPath, fetchData, notifications]
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
