import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import type { FileItem, FolderItem } from '../../types';
import { getFileType } from './FileBrowserHelpers';

interface PreviewDialogProps {
  open: boolean;
  onClose: () => void;
  file: FileItem | FolderItem | null;
}

export const PreviewDialog = ({ open, onClose, file }: PreviewDialogProps) => {
  const [isLoading, setIsLoading] = useState(true);
  if (!file || file.type === 'folder') return null;

  const handleClose = () => {
    setIsLoading(true);
    onClose();
  };

  const fileType = getFileType(file.name);

  const renderPreview = () => {
    switch (fileType) {
      case 'image':
        return (
          <>
            {isLoading && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '80vh',
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <img
              src={file.url}
              alt={file.name}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                display: isLoading ? 'none' : 'block',
              }}
              onLoad={() => setIsLoading(false)}
            />
          </>
        );
      case 'pdf':
        return (
          <iframe
            src={file.url}
            title={file.name}
            style={{ width: '100%', height: '80vh', border: 'none' }}
          />
        );
      default:
        return <p>Podgląd dla tego typu pliku nie jest obsługiwany.</p>;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ m: 0, p: 2 }}>
        Podgląd: {file.name}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 0,
        }}
      >
        {renderPreview()}
      </DialogContent>
    </Dialog>
  );
};
