import React from 'react';
import { Button, Tooltip, IconButton } from '@mui/material';
import {
  FileUpload,
  CreateNewFolder,
  Download,
  DriveFileMove,
  Delete,
} from '@mui/icons-material';
import type { FileBrowserItem } from '@/shared/model/types';
import { useTranslation } from 'react-i18next';

export interface FileToolbarActionsProps {
  selectedRows: FileBrowserItem[];
  loading: boolean;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateFolder: () => void;
  onDownload: (items: FileBrowserItem[]) => void;
  onMove: (items: FileBrowserItem[]) => void;
  onDelete: (items: FileBrowserItem[]) => void;
}

export const FileToolbarActions = ({
  selectedRows,
  loading,
  uploading,
  onUpload,
  onCreateFolder,
  onDownload,
  onMove,
  onDelete,
}: FileToolbarActionsProps) => {
  const { t } = useTranslation('fileBrowser');

  const nonSystemCount = selectedRows.filter((r) => !r.isSystem).length;
  const hasAnySelection = selectedRows.length > 0;
  const canModify = nonSystemCount > 0;

  return (
    <>
      <Button
        key={'upload-desktop'}
        component="label"
        variant="contained"
        size="small"
        startIcon={<FileUpload />}
        disabled={!uploading && loading}
        loading={uploading}
        sx={{
          display: { xs: 'none', md: 'inline-flex' },
          height: 'min-content',
        }}
      >
        {t('actions.upload')}
        <input type="file" hidden multiple onChange={onUpload} />
      </Button>

      <Tooltip title={t('actions.upload')} key={'upload-phone'}>
        <span>
          <IconButton
            disabled={loading}
            component="label"
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
          >
            <FileUpload color="primary" />
            <input type="file" hidden multiple onChange={onUpload} />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title={t('actions.createFolder')} key={'new-folder'}>
        <span>
          <IconButton disabled={loading} onClick={onCreateFolder}>
            <CreateNewFolder />
          </IconButton>
        </span>
      </Tooltip>

      {hasAnySelection && [
        <Tooltip
          title={t('actions.downloadCount', { count: selectedRows.length })}
          key={'download'}
        >
          <span>
            <IconButton
              disabled={!canModify || loading}
              onClick={() => onDownload(selectedRows)}
            >
              <Download />
            </IconButton>
          </span>
        </Tooltip>,
        <Tooltip
          title={t('actions.moveCount', { count: selectedRows.length })}
          key={'move'}
        >
          <span>
            <IconButton
              disabled={!canModify || loading}
              onClick={() => onMove(selectedRows)}
            >
              <DriveFileMove />
            </IconButton>
          </span>
        </Tooltip>,
        <Tooltip
          title={t('actions.deleteCount', { count: selectedRows.length })}
          key={'delete'}
        >
          <span>
            <IconButton
              disabled={!canModify || loading}
              onClick={() => onDelete(selectedRows)}
            >
              <Delete />
            </IconButton>
          </span>
        </Tooltip>,
      ]}
    </>
  );
};
