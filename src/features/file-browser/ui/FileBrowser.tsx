import React, { useState, useCallback } from 'react';
import {
  MaterialReactTable,
  MRT_ActionMenuItem,
  MRT_TopToolbar,
  useMaterialReactTable,
} from 'material-react-table';
import { Box, Typography, Paper, Stack, Divider, alpha } from '@mui/material';
import {
  Delete,
  Edit,
  Visibility,
  Download,
  CloudUpload,
  OpenInNew,
  InfoOutline,
} from '@mui/icons-material';
import useFileBrowser, { EMPTY_MAP } from '../model/services/useFileBrowser';
import { useFileDragAndDrop } from '../lib/useFileDragAndDrop';
import type { FileBrowserItem, FileItem } from '@/shared/model/types';
import { UploadFilesDialog } from '@/shared/ui/UploadFilesDialog';
import { FilePreview } from '@/shared/ui/FilePreviewDialog';
import { canOpenPreview } from '@/shared/lib/fileUtils';
import { openFileInNewTab } from '@/shared/lib/browser';
import { FileDetailsDialog } from './components/FileDetailsDialog';
import { FileToolbarActions } from './components/FileToolbarActions';
import { FileToolbarNavigation } from './components/FileToolbarNavigation';
import { MoveItemsDialog } from './components/MoveFilesDialog';
import { useTranslation } from 'react-i18next';
import { useFileBrowserColumns } from '../lib/useFileBrowserColumns';
import { useMaterialTableLanguage } from '@/shared/lib/useMaterialTableLanguage';

interface FileBrowserProps {
  baseDirectory: string;
  employeesMap?: Record<string, string>;
  constructionsMap?: Record<string, string>;
}

const FileBrowser = ({
  baseDirectory,
  employeesMap = EMPTY_MAP,
  constructionsMap = EMPTY_MAP,
}: FileBrowserProps) => {
  const { t } = useTranslation('fileBrowser');

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] =
    useState<boolean>(false);

  const onFetch = useCallback(() => {
    setRowSelection({});
  }, []);

  const {
    changeCurrentPath,
    currentPath,
    loading,
    handleFileUpload,
    handleRename,
    handleDownload,
    data,
    handleDelete,
    handleCreateFolder,
    uploadProgress,
    openMoveDialog,
    moveDialogOpen,
    closeMoveDialog,
    handleMove,
    destinationFolders,
    isUploadDialogOpen,
    setIsUploadDialogOpen,
    uploading,
  } = useFileBrowser(baseDirectory, onFetch, employeesMap, constructionsMap);

  const { isDragOver, dropRef } = useFileDragAndDrop((files) => {
    handleFileUpload({
      target: { files },
    } as unknown as React.ChangeEvent<HTMLInputElement>);
  });

  const handleOpenPreview = useCallback((file: FileItem) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  }, []);

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
  };

  const handleClikOnName = useCallback(
    async (item: FileBrowserItem) => {
      if (item.type === 'folder') {
        changeCurrentPath(item.path);
      } else if (canOpenPreview(item)) {
        handleOpenPreview(item as FileItem);
      } else {
        await openFileInNewTab(item.path);
      }
    },
    [changeCurrentPath, handleOpenPreview]
  );

  const columns = useFileBrowserColumns();

  const tableLocalization = useMaterialTableLanguage();

  const table = useMaterialReactTable({
    localization: tableLocalization,
    enablePagination: false,
    enableRowVirtualization: true,
    enableStickyHeader: true,
    enableBottomToolbar: false,
    rowVirtualizerOptions: { overscan: 5 },
    muiPaginationProps: {
      color: 'primary',
      shape: 'rounded',
      showRowsPerPage: false,
      variant: 'outlined',
    },
    paginationDisplayMode: 'pages',
    layoutMode: 'grid',
    columns,
    data,
    state: { rowSelection, showSkeletons: loading },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    enableColumnActions: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableHiding: false,
    enablePinning: false,
    enableRowActions: true,
    enableColumnFilters: false,
    positionActionsColumn: 'last',
    initialState: { density: 'comfortable', showGlobalFilter: true },
    muiTableContainerProps: {
      sx: {
        height: '100%',
        maxHeight: '100%',
        width: '100%',
        backgroundColor: 'background.default',
      },
    },
    muiTablePaperProps: {
      sx: {
        width: '100%',
        boxShadow: 'none',
        borderRadius: '0',
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
      },
    },
    displayColumnDefOptions: { 'mrt-row-actions': { header: '', grow: false } },
    positionToolbarAlertBanner: 'none',
    muiTableBodyRowProps: ({ row }) => ({
      onClick: (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input')) return;
        if (window.getSelection()?.toString()) return;
        handleClikOnName(row.original);
      },
      sx: (theme) => ({
        cursor: 'pointer',
        backgroundColor: theme.palette.background.paper,
        '&:hover': { backgroundColor: theme.palette.action.hover },
      }),
    }),
    muiTopToolbarProps: {
      sx: (theme) => ({
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'auto',
        p: 0,
        pb: 0,
        gap: 0,
        background: theme.palette.background.paper,
      }),
    },
    muiSearchTextFieldProps: {
      placeholder: t('searchPlaceholder'),
      variant: 'outlined',
      size: 'small',
    },
    renderEmptyRowsFallback: () => (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          gap: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {t('empty.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('empty.description')}
        </Typography>
      </Box>
    ),
    renderRowActionMenuItems: ({ row, closeMenu }) => {
      const isSystemItem = row.original.isSystem;
      return [
        row.original.type === 'file'
          ? [
              canOpenPreview(row.original) ? (
                <MRT_ActionMenuItem
                  icon={<Visibility />}
                  key="preview"
                  label={t('actions.preview')}
                  onClick={() => {
                    handleOpenPreview(row.original as FileItem);
                    closeMenu();
                  }}
                  table={table}
                />
              ) : null,
              <MRT_ActionMenuItem
                icon={<OpenInNew />}
                key="newTab"
                label={t('actions.openNewTab')}
                onClick={() => {
                  openFileInNewTab((row.original as FileItem).path);
                  closeMenu();
                }}
                table={table}
              />,
              <MRT_ActionMenuItem
                icon={<InfoOutline />}
                key="details"
                label={t('actions.details')}
                onClick={() => {
                  setSelectedFile(row.original as FileItem);
                  setIsDetailsDialogOpen(true);
                  closeMenu();
                }}
                table={table}
              />,
            ]
          : null,
        <MRT_ActionMenuItem
          icon={<Download />}
          key="download"
          label={t('actions.download')}
          onClick={() => {
            handleDownload([row.original]);
            closeMenu();
          }}
          table={table}
        />,
        !isSystemItem && (
          <MRT_ActionMenuItem
            icon={<Edit />}
            key="edit"
            label={t('actions.rename')}
            onClick={() => {
              handleRename(row.original);
              closeMenu();
            }}
            table={table}
          />
        ),
        !isSystemItem && (
          <MRT_ActionMenuItem
            icon={<Delete color="error" />}
            key="delete"
            label={t('actions.delete')}
            onClick={() => {
              handleDelete([row.original]);
              closeMenu();
            }}
            table={table}
          />
        ),
      ].filter(Boolean);
    },
    renderTopToolbarCustomActions: ({ table }) => {
      const selectedRows = table
        .getSelectedRowModel()
        .flatRows.map((row) => row.original);
      return (
        <Box sx={{ pl: 0.5 }}>
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              columnGap: 1,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <FileToolbarActions
              selectedRows={selectedRows}
              loading={loading}
              uploading={uploading}
              onUpload={handleFileUpload}
              onCreateFolder={handleCreateFolder}
              onDownload={handleDownload}
              onMove={openMoveDialog}
              onDelete={handleDelete}
            />
          </Box>
        </Box>
      );
    },
    renderTopToolbar: ({ table }) => {
      const selectedRows = table
        .getSelectedRowModel()
        .flatRows.map((row) => row.original);
      const isSelectionMode = selectedRows.length > 0;
      const totalElementsCount = table.getPrePaginationRowModel().rows.length;

      return (
        <Box sx={{ maxWidth: '100%' }}>
          <MRT_TopToolbar table={table} />

          <Box
            sx={{
              display: { xs: 'flex', sm: 'none' },
              gap: 2,
              flexWrap: 'wrap',
              backgroundColor: 'background.paper',
            }}
          >
            <FileToolbarActions
              selectedRows={selectedRows}
              loading={loading}
              uploading={uploading}
              onUpload={handleFileUpload}
              onCreateFolder={handleCreateFolder}
              onDownload={handleDownload}
              onMove={openMoveDialog}
              onDelete={handleDelete}
            />
          </Box>
          <Divider />

          <FileToolbarNavigation
            isSelectionMode={isSelectionMode}
            selectedCount={selectedRows.length}
            totalElementsCount={totalElementsCount}
            onCancelSelection={() => table.resetRowSelection()}
            currentPath={currentPath}
            baseDirectory={baseDirectory}
            onChangePath={changeCurrentPath}
            employeesMap={employeesMap}
            constructionsMap={constructionsMap}
          />
        </Box>
      );
    },
  });

  const elementsCount = table.getPrePaginationRowModel().rows.length;
  const getElementsText = () => {
    if (elementsCount === 1) return t('itemsWord.one');
    if (elementsCount > 1 && elementsCount < 5) return t('itemsWord.few');
    return t('itemsWord.many');
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <UploadFilesDialog
        isUploadDialogOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        uploadProgress={uploadProgress}
      />

      <Box
        ref={dropRef}
        sx={{
          position: 'relative',
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {isDragOver && (
          <Paper
            sx={(theme) => ({
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alpha(theme.palette.accent.main, 0.5),
              border: `2px dashed ${theme.palette.accent.superDark}`,
              borderRadius: '0',
              pointerEvents: 'none',
            })}
          >
            <Box
              sx={(theme) => ({
                backgroundColor: theme.palette.background.paper,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                borderRadius: '10px',
              })}
            >
              <CloudUpload
                sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
              />
              <Typography variant="h6" color="primary.main">
                {t('dropzone.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('dropzone.uploadTo')}{' '}
                {currentPath.replace(baseDirectory, t('rootDirectory'))}
              </Typography>
            </Box>
          </Paper>
        )}

        <MaterialReactTable table={table} />
        <Stack
          direction={'row'}
          sx={(theme) => ({
            borderTop: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
            p: 1,
            minHeight: '45px',
            alignItems: 'center',
          })}
        >
          <Typography
            variant="overline"
            className="font-medium"
            color="textSecondary"
            sx={{ lineHeight: 1 }}
          >{`${elementsCount} ${getElementsText()}`}</Typography>
        </Stack>
      </Box>

      <MoveItemsDialog
        open={moveDialogOpen}
        folders={destinationFolders}
        onClose={closeMoveDialog}
        onMove={handleMove}
        baseDirectory={baseDirectory}
        currentPath={currentPath}
      />
      <FilePreview
        open={isPreviewOpen}
        onClose={handleClosePreview}
        file={previewFile}
      />
      <FileDetailsDialog
        open={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        file={selectedFile}
      />
    </Box>
  );
};

export default FileBrowser;
