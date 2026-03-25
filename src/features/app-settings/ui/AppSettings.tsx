import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { AttachmentItem } from '@/shared/ui/AttachmentItem';
import { useRodoFile } from '../model/useRodoFile';

interface SettingsProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const RodoSettings = ({ isOpen }: SettingsProps) => {
  const {
    rodoFile,
    isLoading,
    error,
    uploadRodoFile,
    deleteRodoFile,
    downloadRodoFile,
    previewRodoFile,
  } = useRodoFile(isOpen);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadRodoFile(file);
    }
    e.target.value = '';
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

      {isLoading && !rodoFile ? (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress size={24} />
        </Box>
      ) : rodoFile ? (
        <Box sx={{ pt: 2 }}>
          <AttachmentItem
            file={rodoFile}
            onDelete={deleteRodoFile}
            onDownload={downloadRodoFile}
            onShow={previewRodoFile}
            onNameClick={previewRodoFile}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            Aby dodać nowy plik należy wcześniej usunąć stary.
          </Alert>
        </Box>
      ) : (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUpload />}
            size="small"
            disabled={isLoading}
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
