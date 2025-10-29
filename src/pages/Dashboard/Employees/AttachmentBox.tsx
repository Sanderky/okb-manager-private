import { AttachFile, HighlightOff, MoreHoriz } from '@mui/icons-material';
import {
  Typography,
  IconButton,
  Stack,
  Box,
  Menu,
  MenuItem,
  Button,
} from '@mui/material';
import { canOpenPreview } from '../../../components/fileBrowser/FileBrowserHelpers';
import type { FileItem } from '../../../types';
import { useState } from 'react';

interface AttachmentBoxProps {
  file: FileItem | undefined | null;
  onDelete?: () => void;
  onDownload?: () => void;
  onShow?: () => void;
}

const AttachmentBox = ({
  file,
  onDelete,
  onDownload,
  onShow,
}: AttachmentBoxProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (event: React.MouseEvent) => {
    event.stopPropagation();
    setAnchorEl(null);
  };

  if (!file) {
    return (
      <Box
        // className="border-lightGray rounded-lg border p-2"
        marginBottom={2}
      >
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <HighlightOff className="text-gray-500" />
          <Typography variant="body2">Brak załącznika</Typography>
        </Stack>
      </Box>
    );
  }

  const dateCreated = file.timeCreated && new Date(file.timeCreated);

  return (
    <Box marginBottom={2}>
      <Box flexGrow={1}>
        <Stack direction={'row'} alignItems={'center'}>
          <Button
            variant="text"
            startIcon={<AttachFile />}
            sx={{
              p: 0,
              m: 0,
              textTransform: 'none',
            }}
            onClick={() => {
              if (canOpenPreview(file) && onShow) onShow();
            }}
          >
            <Typography variant="subtitle2" noWrap>
              {file.name}
            </Typography>
          </Button>
          <IconButton sx={{ p: 0.1, ml: 0.5, mb: 0.5 }} onClick={handleClick}>
            <MoreHoriz fontSize="small" />
          </IconButton>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            slotProps={{
              list: {
                'aria-labelledby': 'basic-button',
              },
            }}
          >
            {onShow && canOpenPreview(file) && (
              <MenuItem
                onClick={(e) => {
                  onShow();
                  handleClose(e);
                }}
              >
                Pogląd
              </MenuItem>
            )}
            {onDownload && (
              <MenuItem
                onClick={(e) => {
                  onDownload();
                  handleClose(e);
                }}
              >
                Pobierz
              </MenuItem>
            )}
            {onDelete && (
              <MenuItem
                onClick={(e) => {
                  onDelete();
                  handleClose(e);
                }}
              >
                Usuń
              </MenuItem>
            )}
          </Menu>
        </Stack>
        {dateCreated && (
          <Typography variant="caption" color="text.secondary">
            Dodano: {dateCreated.toLocaleString()}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default AttachmentBox;
