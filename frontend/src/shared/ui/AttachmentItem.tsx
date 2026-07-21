import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { type FileItem } from '../model/types';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  AttachFile,
  Delete,
  Download,
  HighlightOff,
  MoreHoriz,
  OpenInNew,
  Visibility,
} from '@mui/icons-material';
import { useState } from 'react';
import { canOpenPreview } from '../lib/fileUtils';

interface AttachmentItemProps {
  file: FileItem | undefined | null;
  onDelete?: () => void;
  onDownload?: () => void;
  onShow?: () => void;
  onNameClick?: () => void;
  onNewCard?: () => void;
}

export const AttachmentItem = ({
  file,
  onDelete,
  onDownload,
  onShow,
  onNewCard,
  onNameClick,
}: AttachmentItemProps) => {
  const { t } = useTranslation('common');
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
      <Box marginBottom={2}>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <HighlightOff className="text-gray-500" />
          <Typography variant="body2">
            {t('attachment.noAttachment')}
          </Typography>
        </Stack>
      </Box>
    );
  }

  const dateCreated = file.createdAt ? dayjs(file.createdAt) : null;
  const canPreview = canOpenPreview({
    name: file.name,
    type: 'file',
  });

  return (
    <Box marginBottom={2}>
      <Box flexGrow={1}>
        <Stack direction={'row'} alignItems={'center'}>
          <Button
            variant="text"
            startIcon={<AttachFile />}
            sx={{ p: 0, m: 0, textTransform: 'none' }}
            onClick={() => {
              if (onNameClick) onNameClick();
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
            id="attachment-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
          >
            {onShow && canPreview && (
              <MenuItem
                onClick={(e) => {
                  onShow();
                  handleClose(e);
                }}
              >
                <Visibility sx={{ color: 'text.secondary', mr: 1 }} />{' '}
                {t('attachment.preview')}
              </MenuItem>
            )}
            {onNewCard && (
              <MenuItem
                onClick={(e) => {
                  onNewCard();
                  handleClose(e);
                }}
              >
                <OpenInNew sx={{ color: 'text.secondary', mr: 1 }} />{' '}
                {t('attachment.openInNewTab')}
              </MenuItem>
            )}
            {onDownload && (
              <MenuItem
                onClick={(e) => {
                  onDownload();
                  handleClose(e);
                }}
              >
                <Download sx={{ color: 'text.secondary', mr: 1 }} />{' '}
                {t('attachment.download')}
              </MenuItem>
            )}
            {onDelete && (
              <MenuItem
                onClick={(e) => {
                  onDelete();
                  handleClose(e);
                }}
              >
                <Delete color="error" sx={{ mr: 1 }} /> {t('buttons.delete')}
              </MenuItem>
            )}
          </Menu>
        </Stack>
        {dateCreated && dateCreated.isValid() && (
          <Typography variant="caption" color="text.secondary">
            {t('attachment.added', { date: dateCreated.format('L LT') })}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
