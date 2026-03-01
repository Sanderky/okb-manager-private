import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import type { FileItem } from '@/shared/model/types';
import * as FilesApi from '@/shared/api/storage';
import { AttachmentItem } from '@/shared/ui/AttachmentItem';

const SYSTEM_BUCKET = import.meta.env.VITE_PUBLIC_BUCKET_NAME ?? 'system';
const RODO_FILENAME = 'rodo.pdf';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RodoSettings = ({ isOpen }: SettingsProps) => {
  const [rodoFile, setRodoFile] = useState<FileItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRodoFile();
    }
  }, [isOpen]);

  const fetchRodoFile = async () => {
    setIsLoading(true);
    try {
      const files = await FilesApi.listFiles('', SYSTEM_BUCKET);
      const rodo = files.find((f) => f.name === RODO_FILENAME);

      if (rodo && rodo.type === 'file') {
        setRodoFile(rodo);
      } else {
        setRodoFile(null);
      }
    } catch (err) {
      console.error('Błąd pobierania RODO:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!rodoFile) return;

    setIsLoading(true);
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

  const handleDownload = async () => {
    if (rodoFile) {
      await FilesApi.downloadFile(rodoFile.path, rodoFile.name, SYSTEM_BUCKET);
    }
  };

  const handlePreview = async () => {
    if (rodoFile) {
      const url = await FilesApi.getSignedUrl(rodoFile.path, 60, SYSTEM_BUCKET);
      if (url) window.open(url, '_blank');
    }
  };

  return (
    <Box>
      <Typography variant="body2" sx={{ my: 2 }}>
        Oświadczenie o przetwarzaniu danych. Dokument jest wyświetlany na
        stronie logowania.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress size={24} />
        </Box>
      ) : rodoFile ? (
        <Box
          sx={{
            pt: 2,
          }}
        >
          <AttachmentItem
            file={rodoFile}
            onDelete={handleDelete}
            onDownload={handleDownload}
            onShow={handlePreview}
            onNameClick={handlePreview}
          />
          <Alert severity="info">
            Aby dodać nowy plik należy wcześniej usunąć stary.
          </Alert>
        </Box>
      ) : (
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
          }}
        >
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUpload />}
            size="small"
          >
            Dodaj plik RODO
            <input
              type="file"
              hidden
              accept="application/pdf"
              onChange={handleUpload}
            />
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Tylko pliki .pdf (nazwa zostanie automatycznie zmieniona na
            rodo.pdf)
          </Typography>
        </Box>
      )}
    </Box>
  );
};
