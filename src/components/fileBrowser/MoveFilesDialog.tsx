import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';

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
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Przenieś do folderu</DialogTitle>
      <DialogContent>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Anuluj</Button>
        {foldersAvailable && (
          <Button
            onClick={handleMove}
            disabled={destination === '' || destination === undefined}
          >
            Przenieś
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MoveItemsDialog;
