import { useState } from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Stack,
} from '@mui/material';
import BaseDialog from '../BaseDialog';

interface MoveItemsDialogProps {
  open: boolean;
  folders: Array<{ name: string; fullPath: string }>;
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
  baseDirectory,
  currentPath,
}: MoveItemsDialogProps) => {
  const [destination, setDestination] = useState('');

  const handleClose = () => {
    setDestination('');
    onClose();
  };
  const handleMove = () => {
    onMove(destination);
    handleClose();
  };

  const foldersAvailable = folders.length > 0;
  const canMove = currentPath !== baseDirectory || foldersAvailable;

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title={`Przenieś do folderu`}
      showConfirm={false}
      actions={
        <Stack direction="row" spacing={1}>
          {foldersAvailable && (
            <Button
              onClick={handleMove}
              disabled={destination === '' || destination === undefined}
            >
              Przenieś
            </Button>
          )}
        </Stack>
      }
    >
      {canMove ? (
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Folder docelowy</InputLabel>
          <Select
            required
            value={destination}
            label="Folder docelowy"
            onChange={(e) => setDestination(e.target.value)}
          >
            {currentPath !== baseDirectory && (
              <MenuItem value={baseDirectory}>Katalog główny</MenuItem>
            )}
            {folders.map((folder) => (
              <MenuItem key={folder.fullPath} value={folder.fullPath}>
                {folder.fullPath.replace(baseDirectory, 'Katalog główny')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <Typography sx={{ mt: 2 }}>
          Brak dostępnych folderów docelowych.
        </Typography>
      )}
    </BaseDialog>
  );
};

export default MoveItemsDialog;
