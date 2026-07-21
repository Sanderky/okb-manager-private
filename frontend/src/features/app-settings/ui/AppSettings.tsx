import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { AttachmentItem } from '@/shared/ui/AttachmentItem';
import { useRodoFile } from '../model/services/useRodoFile';

interface SettingsProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const RodoSettings = ({ isOpen }: SettingsProps) => {
  const { t } = useTranslation('settings');
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
        {t('rodo.description')}
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
            {t('rodo.infoAdd')}
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
            {t('rodo.addButton')}
            <input
              type="file"
              hidden
              accept="application/pdf"
              onChange={handleUpload}
            />
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            {t('rodo.pdfOnly')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
