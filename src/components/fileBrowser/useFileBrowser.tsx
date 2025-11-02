import {
  deleteObject,
  getDownloadURL,
  getMetadata,
  getStorage,
  listAll,
  ref,
  uploadBytesResumable,
  uploadString,
} from 'firebase/storage';
import { useCallback, useEffect, useState } from 'react';
import { useDialogs } from '../../hooks/useDialogs/useDialogs';
import type { FileItem, FolderItem, FileCustom } from '../../types';
import useNotifications from '../../hooks/useNotifications/useNotifications';
import {
  deleteFolderRecursive,
  getFileExtension,
  getFileNameWithoutExtension,
  moveFile,
  moveFolderRecursive,
  getUniqueDestPath,
  listAllFoldersRecursive,
  forceDownloadFile,
} from './FileBrowserHelpers';

const storage = getStorage();

const useFileView = (baseDirectory: string, onFetch: () => void) => {
  const [data, setData] = useState<FileCustom[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(baseDirectory);

  const [loading, setLoading] = useState<boolean>(false);
  const dialogs = useDialogs();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const notifications = useNotifications();
  const [itemsToMove, setItemsToMove] = useState<FileCustom[]>([]);
  const [destinationFolders, setDestinationFolders] = useState<
    Array<{ name: string; fullPath: string }>
  >([]);
  const [moveDialogOpen, setMoveDialogOpen] = useState<boolean>(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);

  const downloadFile = useCallback(
    (url: string, fileName: string): void => {
      try {
        forceDownloadFile(url, fileName);
      } catch (e) {
        console.error('Download error:', e);
        notifications.show('Błąd podczas pobierania pliku', {
          severity: 'error',
          autoHideDuration: 5000,
        });
      }
    },
    [notifications]
  );

  const handleDownloadZip = useCallback(
    async (items: FileCustom[]): Promise<void> => {
      const allItems = items.filter(
        (item) => item.type === 'file' || item.type === 'folder'
      );
      if (allItems.length === 0) {
        return;
      }
      const functionUrl =
        import.meta.env.VITE_FIREBASE_CLOUD_FUNCTION_CREATE_ZIP_URL ?? '';
      try {
        setLoading(true);
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: allItems,
            includeSubdirectories: true,
            baseDirectory: baseDirectory,
          }),
        });
        if (!response.ok)
          throw new Error(`Server error: ${response.statusText}`);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `archiwum-${Date.now()}.zip`);
        document.body.appendChild(link);
        link.click();
        if (link.parentNode) link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('ZIP download error:', error);
        notifications.show('Wystąpił błąd podczas tworzenia archiwum!', {
          severity: 'error',
          autoHideDuration: 5000,
        });
      } finally {
        setLoading(false);
      }
    },
    [notifications, baseDirectory]
  );

  const handleDownload = useCallback(
    (items: FileCustom[]) => {
      if (items.length === 1 && items[0].type === 'file') {
        downloadFile(items[0].url, items[0].name);
      } else {
        handleDownloadZip(items);
      }
    },
    [downloadFile, handleDownloadZip]
  );

  const fetchData = useCallback(
    async (path: string): Promise<void> => {
      setLoading(true);
      onFetch();
      const listRef = ref(storage, path);
      try {
        const res = await listAll(listRef);
        const folders: FolderItem[] = res.prefixes.map((folderRef) => ({
          name: folderRef.name,
          type: 'folder',
          fullPath: folderRef.fullPath,
        }));
        const files: FileItem[] = await Promise.all(
          res.items
            .filter((item) => !item.name.endsWith('.placeholder'))
            .map(async (itemRef) => {
              const [url, metadata] = await Promise.all([
                getDownloadURL(itemRef),
                getMetadata(itemRef),
              ]);
              return {
                name: itemRef.name,
                type: 'file',
                fullPath: itemRef.fullPath,
                url,
                timeCreated: metadata.timeCreated,
                size: metadata.size,
                contentType: metadata.contentType,
              };
            })
        );
        setData([...folders, ...files]);
      } catch (error) {
        console.error('Fetch files error:', error);
        notifications.show('Bład poczas ładowania plików!', {
          severity: 'error',
          autoHideDuration: 5000,
        });
      } finally {
        setLoading(false);
      }
    },
    [notifications, onFetch]
  );

  useEffect(() => {
    fetchData(currentPath);
  }, [currentPath, fetchData]);

  const handleCreateFolder = useCallback(async (): Promise<void> => {
    const folderName = await dialogs.prompt(`Podaj nazwę nowego folderu:`, {
      title: `Nowy folder`,
      okText: 'Utwórz',
      cancelText: 'Anuluj',
    });
    if (folderName) {
      const folderExists = data.some(
        (item) => item.name === folderName && item.type === 'folder'
      );
      if (folderExists) {
        notifications.show('Taki folder już istnieje!', {
          severity: 'error',
          autoHideDuration: 5000,
        });
        return;
      }
      try {
        const folderPath = `${currentPath}/${folderName}/.placeholder`;
        const folderRef = ref(storage, folderPath);
        await uploadString(folderRef, '');
        await fetchData(currentPath);
        notifications.show('Nowy folder został utworzony', {
          severity: 'success',
          autoHideDuration: 3000,
        });
      } catch (error) {
        console.error('Create new folder error:', error);
        notifications.show('Błąd podczas tworzenia folderu!', {
          severity: 'error',
          autoHideDuration: 5000,
        });
      }
    }
  }, [notifications, fetchData, data, currentPath, dialogs]);

  const handleDelete = useCallback(
    async (items: FileCustom[]): Promise<void> => {
      const confirmation = await dialogs.confirm(
        `Czy na pewno chcesz usunąć ${items.length} element(ów)?`,
        {
          title: `Usuwanie plików`,
          severity: 'error',
          okText: 'Usuń',
          cancelText: 'Anuluj',
        }
      );
      if (confirmation) {
        try {
          await Promise.all(
            items.map((item) => {
              if (item.type === 'file')
                return deleteObject(ref(storage, item.fullPath));
              return deleteFolderRecursive(item.fullPath);
            })
          );
          await fetchData(currentPath);
          notifications.show('Pliki zostały usunięte', {
            severity: 'success',
            autoHideDuration: 5000,
          });
        } catch (error) {
          console.error('Delete files:', error);
          notifications.show('Błąd podczas usuwania plików!', {
            severity: 'error',
            autoHideDuration: 5000,
          });
        }
      }
    },
    [currentPath, dialogs, fetchData, notifications]
  );

  const handleRename = useCallback(
    async (item: FileCustom): Promise<void> => {
      let newName: string | null = null;
      if (item.type === 'file') {
        const extension = getFileExtension(item.name);
        const nameWithoutExtension = getFileNameWithoutExtension(item.name);
        newName = await dialogs.prompt('Podaj nową nazwę:', {
          okText: 'Zmień',
          cancelText: 'Anuluj',
          title: 'Zmiana nazwy pliku',
          defaultValue: nameWithoutExtension,
        });
        if (newName) newName = `${newName}${extension ? '.' + extension : ''}`;
      } else if (item.type === 'folder') {
        newName = await dialogs.prompt('Podaj nową nazwę:', {
          okText: 'Zmień',
          cancelText: 'Anuluj',
          title: 'Zmiana nazwy folderu',
          defaultValue: item.name,
        });
      }

      if (!newName || newName === item.name) return;
      setLoading(true);
      const oldPath = item.fullPath;
      const newPath = currentPath ? `${currentPath}/${newName}` : newName;
      const fileExists = data.some((item) => item.name === newName);
      if (fileExists) {
        notifications.show('Plik o takiej nazwie już istnieje!', {
          severity: 'error',
          autoHideDuration: 5000,
        });
        setLoading(false);
        return;
      }
      try {
        if (item.type === 'file') await moveFile(oldPath, newPath);
        else if (item.type === 'folder')
          await moveFolderRecursive(oldPath, newPath);
        await fetchData(currentPath);
        notifications.show('Nazwa pliku została zmieniona', {
          severity: 'success',
          autoHideDuration: 5000,
        });
      } catch (error) {
        console.error('Rename error:', error);
        notifications.show('Błąd podczas zmiany nazwy!', {
          severity: 'error',
          autoHideDuration: 5000,
        });
      }
      setLoading(false);
    },
    [data, currentPath, dialogs, notifications, fetchData]
  );

  const handleMove = useCallback(
    async (destinationPath: string): Promise<void> => {
      setLoading(true);
      try {
        await Promise.all(
          itemsToMove.map(async (item) => {
            const proposedDestPath = `${destinationPath}/${item.name}`;
            if (item.type === 'file') {
              const uniqueDestPath = await getUniqueDestPath(proposedDestPath);
              return moveFile(item.fullPath, uniqueDestPath);
            } else {
              return moveFolderRecursive(item.fullPath, proposedDestPath);
            }
          })
        );
        setItemsToMove([]);
      } catch (error) {
        console.error('Move files error:', error);
        notifications.show('Błąd podczas przenoszenia plików!', {
          severity: 'error',
          autoHideDuration: 5000,
        });
      } finally {
        setLoading(false);
        await fetchData(currentPath);
        notifications.show('Pliki zostały przeniesione', {
          severity: 'success',
          autoHideDuration: 5000,
        });
      }
    },
    [fetchData, notifications, currentPath, itemsToMove]
  );

  const openMoveDialog = useCallback(
    async (items: FileCustom[]): Promise<void> => {
      setItemsToMove(items);
      setLoading(true);
      const allFolders = await listAllFoldersRecursive(baseDirectory);
      const sourceFolderPaths = items
        .filter((item): item is FolderItem => item.type === 'folder')
        .map((item) => item.fullPath);
      const filteredFolders = allFolders.filter((destFolder) => {
        if (destFolder.fullPath === currentPath) return false;
        return !sourceFolderPaths.some(
          (srcPath) =>
            destFolder.fullPath === srcPath ||
            destFolder.fullPath.startsWith(srcPath + '/')
        );
      });
      setDestinationFolders(filteredFolders);
      setLoading(false);

      setMoveDialogOpen(true);
    },
    [currentPath, baseDirectory]
  );

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      setIsUploadDialogOpen(true);
      const uploadPromises: Promise<void>[] = [];
      for (const file of files) {
        let finalFileName = file.name;
        let counter = 1;
        while (
          data.some(
            (item) => item.name === finalFileName && item.type === 'file'
          )
        ) {
          const dotIndex = file.name.lastIndexOf('.');
          const nameWithoutExt =
            dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
          const extension =
            dotIndex !== -1 ? file.name.substring(dotIndex) : '';
          finalFileName = `${nameWithoutExt} (${counter})${extension}`;
          counter++;
        }
        const filePath = `${currentPath}/${finalFileName}`;
        const fileRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(fileRef, file);
        const promise = new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
            },
            (error) => {
              setUploadProgress((prev) => {
                const newProgress = { ...prev };
                delete newProgress[file.name];
                return newProgress;
              });
              reject(error);
            },
            async () => {
              await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
        uploadPromises.push(promise);
      }
      try {
        await Promise.all(uploadPromises);

        fetchData(currentPath);
        notifications.show(`Dodano pliki (${files.length})`, {
          severity: 'success',
          autoHideDuration: 3000,
        });
      } catch (error) {
        console.error('Upload files error:', error);
        notifications.show('Błąd podczas przesyłania plików!', {
          severity: 'error',
          autoHideDuration: 5000,
        });
      } finally {
        setUploadProgress({});
        setIsUploadDialogOpen(false);
      }
    },
    [currentPath, fetchData, data, notifications]
  );

  const changeCurrentPath = (path: string) => setCurrentPath(path);

  const closeMoveDialog = () => setMoveDialogOpen(false);

  return {
    loading,
    data,
    uploadProgress,
    moveDialogOpen,
    destinationFolders,
    changeCurrentPath,
    currentPath,
    handleFileUpload,
    handleRename,
    handleDownload,
    handleCreateFolder,
    handleDelete,
    openMoveDialog,
    closeMoveDialog,
    handleMove,
    isUploadDialogOpen,
  };
};

export default useFileView;
