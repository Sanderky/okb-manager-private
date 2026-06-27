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
import BaseDialog from '@/shared/ui/BaseDialog';
import { Folder, Reply } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const NO_SELECTION_VALUE = '___NO_SELECTION___';

interface MoveItemsDialogProps {
  open: boolean;
  folders: Array<{ name: string; path: string }>;
  onClose: () => void;
  onMove: (destinationPath: string) => Promise<void>;
  baseDirectory: string;
  currentPath: string;
}

export const MoveItemsDialog = ({
  open,
  folders,
  onClose,
  onMove,
}: MoveItemsDialogProps) => {
  const { t } = useTranslation(['fileBrowser', 'common']);
  const [destination, setDestination] = useState<string>(NO_SELECTION_VALUE);

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
    if (destination !== NO_SELECTION_VALUE) {
      onMove(destination);
      handleClose();
    }
  };

  const canMove = folders.length > 0;

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title={t('move.title')}
      showConfirm={false}
      actions={
        <Stack direction="row" spacing={1}>
          <Button onClick={handleClose} color="inherit" variant="outlined">
            {t('common:buttons.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleMove}
            disabled={destination === NO_SELECTION_VALUE}
          >
            {t('move.moveAction')}
          </Button>
        </Stack>
      }
    >
      {canMove ? (
        <Box sx={{ mt: 1, minWidth: 300 }}>
          <Typography variant="body2" gutterBottom>
            {t('move.selectDestination')}
          </Typography>

          <FormControl fullWidth>
            <Select
              labelId="move-dest-label"
              value={destination}
              size="small"
              displayEmpty
              onChange={(e) => setDestination(e.target.value)}
              renderValue={(selected) => {
                if (selected === NO_SELECTION_VALUE) {
                  return (
                    <Typography color="text.secondary">
                      {t('move.selectFolder')}
                    </Typography>
                  );
                }
                const selectedFolder = folders.find((f) => f.path === selected);
                return selectedFolder ? selectedFolder.name : selected;
              }}
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
          <Typography color="text.secondary">{t('move.noFolders')}</Typography>
          <Typography color="text.secondary" mt={2} mb={2}>
            {t('move.onlySubfolders')}
          </Typography>
        </Box>
      )}
    </BaseDialog>
  );
};
