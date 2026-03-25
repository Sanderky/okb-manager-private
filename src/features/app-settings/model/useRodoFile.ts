import { useState, useEffect } from 'react';
import * as FilesApi from '@/shared/api/storage';
import type { FileItem } from '@/shared/model/types';

const SYSTEM_BUCKET = import.meta.env.VITE_PUBLIC_BUCKET_NAME ?? 'system';
const RODO_FILENAME = 'rodo.pdf';

export const useRodoFile = (isOpen: boolean) => {
  const [rodoFile, setRodoFile] = useState<FileItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRodoFile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const files = await FilesApi.listFiles('', SYSTEM_BUCKET);
      const rodo = files.find((f) => f.name === RODO_FILENAME);
      setRodoFile(rodo?.type === 'file' ? rodo : null);
    } catch (err) {
      console.error('Błąd pobierania RODO:', err);
      setError('Nie udało się pobrać informacji o pliku RODO.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRodoFile();
    }
  }, [isOpen]);

  const uploadRodoFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Dozwolone są tylko pliki PDF.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await FilesApi.uploadFile(
        RODO_FILENAME,
        file,
        undefined,
        SYSTEM_BUCKET,
        true
      );
      await fetchRodoFile();
    } catch (err) {
      console.error(err);
      setError('Wystąpił błąd podczas wysyłania pliku.');
      setIsLoading(false);
    }
  };

  const deleteRodoFile = async () => {
    if (!rodoFile) return;
    setIsLoading(true);
    setError(null);
    try {
      await FilesApi.deleteFiles([rodoFile.path], SYSTEM_BUCKET);
      setRodoFile(null);
    } catch (err) {
      console.error(err);
      setError('Nie udało się usunąć pliku.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadRodoFile = async () => {
    if (!rodoFile) return;
    try {
      await FilesApi.downloadFile(rodoFile.path, rodoFile.name, SYSTEM_BUCKET);
    } catch (err) {
      setError('Błąd podczas pobierania pliku.');
    }
  };

  const previewRodoFile = async () => {
    if (!rodoFile) return;
    try {
      const url = await FilesApi.getSignedUrl(rodoFile.path, 60, SYSTEM_BUCKET);
      if (url) window.open(url, '_blank');
    } catch (err) {
      setError('Błąd podczas otwierania podglądu.');
    }
  };

  return {
    rodoFile,
    isLoading,
    error,
    uploadRodoFile,
    deleteRodoFile,
    downloadRodoFile,
    previewRodoFile,
  };
};
