import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as FilesApi from '@/shared/api/storage';
import type { FileItem } from '@/shared/model/types';
import { PUBLIC_STORAGE_BUCKET, RODO_FILENAME } from '@/shared/api/supabase';

const SYSTEM_BUCKET = PUBLIC_STORAGE_BUCKET;

export const useRodoFile = (isOpen: boolean) => {
  const { t } = useTranslation('settings');
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
    } catch {
      setError(t('errors.fetchRodo'));
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
      setError(t('errors.onlyPdf'));
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
      setError(t('errors.upload'));
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
      setError(t('errors.delete'));
    } finally {
      setIsLoading(false);
    }
  };

  const downloadRodoFile = async () => {
    if (!rodoFile) return;
    try {
      await FilesApi.downloadFile(rodoFile.path, rodoFile.name, SYSTEM_BUCKET);
    } catch {
      setError(t('errors.download'));
    }
  };

  const previewRodoFile = async () => {
    if (!rodoFile) return;
    try {
      const url = await FilesApi.getSignedUrl(rodoFile.path, 60, SYSTEM_BUCKET);
      if (url) window.open(url, '_blank');
    } catch {
      setError(t('errors.preview'));
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
