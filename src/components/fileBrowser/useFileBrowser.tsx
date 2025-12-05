import { useCallback, useEffect, useState } from 'react';
import { useDialogs } from '../../hooks/useDialogs/useDialogs';
import useNotifications from '../../hooks/useNotifications/useNotifications';
import * as StorageService from '../../services/storage';
import type { FileBrowserItem } from '../../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const useFileBrowser = (baseDirectory: string, onFetch: () => void) => {
  const [data, setData] = useState<FileBrowserItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(baseDirectory);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );

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
        const items = await StorageService.listFiles(path);
        setData(items);
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
          await StorageService.downloadFile(items[0].path, items[0].name);
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
            const blob = await StorageService.downloadFileAsBlob(item.path);
            if (blob) {
              currentZipFolder.file(item.name, blob);
              count++;
            }
          } else {
            const newZipFolder = currentZipFolder.folder(item.name);
            if (newZipFolder) {
              const subItems = await StorageService.listFiles(item.path);
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

    if (data.some((i) => i.name === folderName && i.type === 'folder')) {
      notifications.show('Taki folder już istnieje!', { severity: 'error' });
      return;
    }

    try {
      const path = currentPath ? `${currentPath}/${folderName}` : folderName;
      await StorageService.createFolder(path);
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
      if (
        !(await dialogs.confirm(
          `Czy na pewno usunąć ${items.length} element(ów)?`,
          {
            title: 'Usuwanie plików',
            severity: 'error',
            okText: 'Usuń',
            cancelText: 'Anuluj',
          }
        ))
      )
        return;

      try {
        const files = items.filter((i) => i.type === 'file').map((i) => i.path);
        if (files.length > 0) await StorageService.deleteFiles(files);

        const folders = items.filter((i) => i.type === 'folder');

        await Promise.all(
          folders.map((f) => StorageService.deleteFolderRecursive(f.path))
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
      const isFile = item.type === 'file';
      const defaultValue = isFile
        ? StorageService.getFileNameWithoutExtension(item.name)
        : item.name;
      const title = isFile ? 'Zmień nazwę pliku' : 'Zmień nazwę folderu';

      let newName = await dialogs.prompt('Podaj nową nazwę:', {
        title,
        defaultValue,
        okText: 'Zmień',
      });
      if (!newName || newName === defaultValue) return;

      if (isFile) {
        const ext = StorageService.getFileExtension(item.name);
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
          await StorageService.moveFile(item.path, newPath);
        } else {
          await StorageService.moveFolderRecursive(item.path, newPath);
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

      const promises: Promise<void>[] = [];

      for (const file of files) {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
      }

      for (const file of files) {
        const finalName = file.name;
        const proposedPath = currentPath
          ? `${currentPath}/${finalName}`
          : finalName;

        const uniquePath = await StorageService.getUniqueDestPath(proposedPath);

        promises.push(
          StorageService.uploadFile(uniquePath, file, (prog) => {
            setUploadProgress((prev) => ({ ...prev, [file.name]: prog }));
          })
        );
      }

      try {
        await Promise.all(promises);
        await fetchData(currentPath);
        notifications.show(`Przesłano ${files.length} plików`, {
          severity: 'success',
        });
      } catch (error) {
        notifications.show('Błąd podczas przesyłania plików.', {
          severity: 'error',
        });
      } finally {
        setTimeout(() => {
          setIsUploadDialogOpen(false);
          setUploadProgress({});
        }, 500);
      }
    },
    [currentPath, fetchData, notifications]
  );

  const openMoveDialog = useCallback(
    (items: FileBrowserItem[]) => {
      setItemsToMove(items);

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
    [currentPath, baseDirectory, data]
  );

  const handleMove = useCallback(
    async (destPath: string) => {
      setLoading(true);
      try {
        for (const item of itemsToMove) {
          const targetPath = destPath ? `${destPath}/${item.name}` : item.name;

          if (item.type === 'file') {
            const uniquePath =
              await StorageService.getUniqueDestPath(targetPath);
            await StorageService.moveFile(item.path, uniquePath);
          } else {
            await StorageService.moveFolderRecursive(item.path, targetPath);
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
    uploadProgress,
  };
};

export default useFileBrowser;
