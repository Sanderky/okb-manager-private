import { Box, Typography, Stack, CircularProgress } from '@mui/material';
import { Check, ErrorOutline } from '@mui/icons-material';
import 'dayjs/locale/pl';
import BaseDialog from '../BaseDialog';

interface UploadFilesDialogProps {
  isUploadDialogOpen: boolean;
  onClose: () => void;
  uploadProgress: Record<string, number>;
}

const UploadFilesDialog = ({
  isUploadDialogOpen,
  onClose,
  uploadProgress,
}: UploadFilesDialogProps) => {
  return (
    <BaseDialog
      open={isUploadDialogOpen}
      onClose={onClose}
      title={'Przesyłanie plików'}
    >
      <>
        {Object.keys(uploadProgress).length > 0 && (
          <Box>
            {Object.entries(uploadProgress).map(
              ([fileName, progress], index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Stack direction={'row'} alignItems={'center'} spacing={1}>
                    {progress === -1 ? (
                      <ErrorOutline color="error" sx={{ fontSize: '1rem' }} />
                    ) : progress === 100 ? (
                      <Check sx={{ fontSize: '1rem' }} />
                    ) : (
                      <CircularProgress size={15} />
                    )}
                    <Typography variant="subtitle2">{fileName}</Typography>
                  </Stack>
                </Box>
              )
            )}
          </Box>
        )}
      </>
    </BaseDialog>
  );
};

export default UploadFilesDialog;
