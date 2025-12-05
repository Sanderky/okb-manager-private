import { useState, useEffect } from 'react';
import {
  Button,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Stack,
  Box,
} from '@mui/material';
import BaseDialog from '../BaseDialog';
import { Folder, Reply } from '@mui/icons-material';

interface MoveItemsDialogProps {
  open: boolean;
  folders: Array<{ name: string; path: string }>;
  onClose: () => void;
  onMove: (destinationPath: string) => Promise<void>;
  baseDirectory: string;
  currentPath: string;
}

const MoveItemsDialog = ({
  open,
  folders,
  onClose,
  onMove,
}: MoveItemsDialogProps) => {
  const [destination, setDestination] = useState<string>('');

  useEffect(() => {
    if (open) {
      setDestination('');
    }
  }, [open]);

  const handleClose = () => {
    setDestination('');
    onClose();
  };

  const handleMove = () => {
    if (destination !== '') {
      onMove(destination);
      handleClose();
    }
  };

  const canMove = folders.length > 0;

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title="Przenieś elementy"
      showConfirm={false}
      actions={
        <Stack direction="row" spacing={1}>
          <Button onClick={handleClose} color="inherit" variant="outlined">
            Anuluj
          </Button>
          <Button
            variant="contained"
            onClick={handleMove}
            disabled={destination === ''}
          >
            Przenieś
          </Button>
        </Stack>
      }
    >
      {canMove ? (
        <Box sx={{ mt: 1, minWidth: 300 }}>
          <Typography variant="body2" gutterBottom>
            Wybierz miejsce docelowe:
          </Typography>

          <FormControl fullWidth>
            <Select
              labelId="move-dest-label"
              value={destination}
              size="small"
              onChange={(e) => setDestination(e.target.value)}
            >
              {folders.map((folder) => {
                const isBackOption = folder.name.includes('..');

                return (
                  <MenuItem key={folder.path} value={folder.path}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      {isBackOption ? (
                        <Reply fontSize="small" />
                      ) : (
                        <Folder fontSize="small" />
                      )}
                      <Typography
                        variant="body2"
                        fontWeight={isBackOption ? 600 : 400}
                      >
                        {folder.name}
                      </Typography>
                    </Stack>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>
      ) : (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Brak dostępnych folderów w tej lokalizacji.
          </Typography>
          <Typography color="text.secondary" mt={2} mb={2}>
            Możesz przenieść pliki tylko do podfolderów lub katalogu wyżej.
          </Typography>
        </Box>
      )}
    </BaseDialog>
  );
};

export default MoveItemsDialog;
