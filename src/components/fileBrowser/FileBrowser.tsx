import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  MaterialReactTable,
  MRT_ActionMenuItem,
  MRT_TopToolbar,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import {
  Box,
  IconButton,
  Button,
  Tooltip,
  Typography,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import {
  Folder,
  Delete,
  Edit,
  ArrowBack,
  FileUpload,
  CreateNewFolder,
  DriveFileMove,
  Visibility,
  Download,
  InsertDriveFileOutlined,
  CloudUpload,
  OpenInNew,
  InsertPhotoOutlined,
  DescriptionOutlined,
  InfoOutline,
} from '@mui/icons-material';
import MoveItemsDialog from './MoveFilesDialog';
import { PreviewDialog } from './FilePreviewDialog';
import type { FileItem, FileCustom } from '../../types';
import useFileView from './useFileBrowser';
import { canOpenPreview, formatBytes, getFileType } from './FileBrowserHelpers';
import PdfIcon from '../../assets/icons/file-pdf.svg?react';
import 'dayjs/locale/pl';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MRT_Localization_PL } from 'material-react-table/locales/pl';
import BaseDialog from '../BaseDialog';

// const BASE_DIRECTORY = 'files';

const RenderFileImage = ({ file }: { file: FileCustom }) => {
  if (file.type === 'folder') return <Folder />;
  const fileType = getFileType(file.name);
  // if(fileType === 'pdf') return <PictureAsPdfOutlined/>
  if (fileType === 'pdf') return <PdfIcon width={24} height={24} />;
  if (fileType === 'image') return <InsertPhotoOutlined />;
  if (fileType === 'text') return <DescriptionOutlined />;
  if (fileType === 'word') return <DescriptionOutlined />;
  return <InsertDriveFileOutlined />;
};

interface FileDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  file: FileItem | null;
}

const FileDetailsItem = ({
  title,
  value,
}: {
  title: string;
  value: string;
}) => {
  return (
    <Box>
      <Typography variant="subtitle2" component={'div'}>
        {title}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
};

export const FileDetailsDialog: React.FC<FileDetailsDialogProps> = ({
  open,
  onClose,
  file,
}) => {
  if (!file) return null;

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={`Szczegóły pliku`}
      showConfirm={false}
    >
      <Stack
        direction={'column'}
        alignItems={'flex-start'}
        spacing={{ xs: 2, sm: 1 }}
      >
        <FileDetailsItem title="Nazwa" value={file.name} />

        <FileDetailsItem
          title="Data dodania"
          value={
            file.timeCreated
              ? new Date(file.timeCreated).toLocaleString()
              : 'brak danych'
          }
        />
        <FileDetailsItem
          title="Rozmiar"
          value={file.size ? formatBytes(file.size as number) : 'brak danych'}
        />
        <FileDetailsItem
          title="Rodzaj"
          value={file.contentType ?? 'brak danych'}
        />
      </Stack>
    </BaseDialog>
  );
};

const FileBreadcrumps = ({
  path,
  baseDirectory,
  onClick,
}: {
  path: string;
  baseDirectory: string;
  onClick: (path: string) => void;
}) => {
  const pathParts = path.replace(baseDirectory, 'Katalog główny').split('/');
  if (pathParts.length > 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          flexWrap: 'nowrap',
          flexShrink: 0,
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        {pathParts.map((part, index) => {
          const href = pathParts
            .slice(0, index + 1)
            .join('/')
            .replace('Katalog główny', baseDirectory);

          return (
            <React.Fragment key={index}>
              {index < pathParts.length - 1 ? (
                <Typography
                  color="text.primary"
                  variant="body2"
                  sx={{
                    maxWidth: '150px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                  onClick={() => onClick(href)}
                >
                  {part}
                </Typography>
              ) : (
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{
                    maxWidth: '150px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {part}
                </Typography>
              )}
              {index < pathParts.length - 1 && (
                <Typography color="text.secondary" variant="body2">
                  /
                </Typography>
              )}
            </React.Fragment>
          );
        })}
      </Box>
    );
  }
};

interface FirebaseFileBrowserProps {
  baseDirectory: string;
}

const FirebaseFileBrowser = ({ baseDirectory }: FirebaseFileBrowserProps) => {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] =
    useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const dropRef = useRef<HTMLDivElement>(null);

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
  } = useFileView(baseDirectory, onFetch);

  const handleOpenPreview = useCallback((file: FileItem) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  }, []);

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
  };

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentTarget = e.currentTarget as HTMLElement;
    if (currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (e.dataTransfer) {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          handleFileUpload({
            target: { files },
          } as React.ChangeEvent<HTMLInputElement>);
        }
      }
    },
    [handleFileUpload]
  );

  useEffect(() => {
    const dropArea = dropRef.current;
    if (!dropArea) return;

    dropArea.addEventListener('dragenter', handleDragEnter);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('drop', handleDrop);
    return () => {
      dropArea.removeEventListener('dragenter', handleDragEnter);
      dropArea.removeEventListener('dragleave', handleDragLeave);
      dropArea.removeEventListener('dragover', handleDragOver);
      dropArea.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  const handleOpenFileInNewTab = useCallback((url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  }, []);

  const handleClikOnName = useCallback(
    (item: FileCustom) => {
      if (item.type === 'folder') {
        changeCurrentPath(item.fullPath);
      } else if (canOpenPreview(item)) {
        handleOpenPreview(item);
      } else {
        handleOpenFileInNewTab(item.url);
      }
    },
    [changeCurrentPath, handleOpenPreview, handleOpenFileInNewTab]
  );

  const columns = useMemo<MRT_ColumnDef<FileCustom>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nazwa',
        muiTableBodyCellProps: {
          sx: {
            pl: 0,
          },
        },
        muiTableHeadCellProps: {
          sx: {
            pl: 0,
          },
        },
        Cell: ({ cell, row }) => (
          <Stack
            direction={'row'}
            alignItems={'center'}
            spacing={1}
            onClick={() => handleClikOnName(row.original)}
            sx={{ cursor: 'pointer' }}
          >
            <RenderFileImage file={row.original} />
            <Tooltip
              enterDelay={500}
              enterNextDelay={500}
              title={cell.getValue() as string}
            >
              <Typography
                variant="body2"
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  display: 'block',
                }}
                noWrap
              >
                {cell.getValue() as string}
              </Typography>
            </Tooltip>
          </Stack>
        ),
      },
      {
        accessorKey: 'timeCreated',
        header: 'Data dodania',
        grow: false,
        size: 150,
        muiTableHeadCellProps: {
          sx: { display: { xs: 'none', md: 'table-cell' } },
        },
        muiTableBodyCellProps: {
          sx: { display: { xs: 'none', md: 'table-cell' } },
        },
        Cell: ({ cell, row }) => {
          if (row.original.type === 'folder') return '';
          return (
            <Tooltip
              enterDelay={500}
              enterNextDelay={500}
              title={new Date(cell.getValue() as string).toLocaleString(
                'pl-PL'
              )}
            >
              <span>
                {new Date(cell.getValue() as string).toLocaleDateString(
                  'pl-PL'
                )}
              </span>
            </Tooltip>
          );
        },
      },
      {
        accessorKey: 'size',
        header: 'Rozmiar',
        muiTableHeadCellProps: {
          sx: { display: { xs: 'none', md: 'table-cell' } },
        },
        muiTableBodyCellProps: {
          sx: { display: { xs: 'none', md: 'table-cell' } },
        },
        grow: false,
        size: 150,
        Cell: ({ cell, row }) => {
          if (row.original.type === 'folder') return '';
          return (
            <Chip
              label={formatBytes(cell.getValue() as number)}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        accessorKey: 'contentType',
        header: 'Rodzaj',
        grow: false,
        size: 150,
        muiTableHeadCellProps: {
          sx: { display: { xs: 'none', md: 'table-cell' } },
        },
        muiTableBodyCellProps: {
          sx: { display: { xs: 'none', md: 'table-cell' } },
        },
        Cell: ({ row }) => {
          return (
            <Chip
              label={
                row.original.type === 'folder'
                  ? 'folder'
                  : row.original.contentType
              }
              size="small"
              variant="outlined"
            />
          );
        },
      },
    ],
    [handleClikOnName]
  );

  const renderToolbarButtons = (selectedRows: FileCustom[]) => {
    return (
      <>
        <Button
          component="label"
          variant="contained"
          size="small"
          startIcon={<FileUpload />}
          sx={{
            display: { xs: 'none', md: 'inline-flex' },
          }}
        >
          Prześlij pliki
          <input type="file" hidden multiple onChange={handleFileUpload} />
        </Button>
        <Tooltip title="Prześlij pliki">
          <span>
            <IconButton
              component="label"
              sx={{
                display: { xs: 'inline-flex', md: 'none' },
              }}
            >
              <FileUpload color="primary" />
              <input type="file" hidden multiple onChange={handleFileUpload} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Utwórz folder">
          <IconButton onClick={handleCreateFolder}>
            <CreateNewFolder />
          </IconButton>
        </Tooltip>
        <Tooltip title={`Pobierz (${selectedRows.length})`}>
          <span>
            <IconButton
              disabled={selectedRows.length === 0}
              onClick={() => handleDownload(selectedRows)}
            >
              <Download />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={`Przenieś (${selectedRows.length})`}>
          <span>
            <IconButton
              disabled={selectedRows.length === 0}
              onClick={() => openMoveDialog(selectedRows)}
            >
              <DriveFileMove />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={`Usuń (${selectedRows.length})`}>
          <span>
            <IconButton
              disabled={selectedRows.length === 0}
              onClick={() => handleDelete(selectedRows)}
            >
              <Delete />
            </IconButton>
          </span>
        </Tooltip>
      </>
    );
  };

  const table = useMaterialReactTable({
    localization: MRT_Localization_PL,
    //pagination
    enablePagination: true,
    enableBottomToolbar: true,
    enableStickyHeader: false,

    //scroll
    // enableStickyHeader: true,
    // enablePagination: false,
    // enableBottomToolbar: false,
    //

    muiPaginationProps: {
      color: 'primary',

      shape: 'rounded',

      showRowsPerPage: false,

      variant: 'outlined',
    },
    positionGlobalFilter: 'right',

    paginationDisplayMode: 'pages',
    layoutMode: 'grid',
    columns,
    data,
    state: {
      rowSelection,
      showSkeletons: loading,
      showProgressBars: loading,
    },
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
    initialState: {
      density: 'comfortable',
      showGlobalFilter: true,
    },
    muiTableContainerProps: {
      sx: {
        // minHeight: '500px',
        // maxHeight: '500px',
        width: '100%',
      },
    },
    muiTableBodyCellProps: {
      sx: {},
    },
    muiTablePaperProps: {
      sx: {
        width: '100%',
        boxShadow: 'none',
        border: '1px solid #e0e0e0',
        borderRadius: '10px',
      },
    },

    displayColumnDefOptions: {
      'mrt-row-actions': {
        header: '',
        grow: false,
      },
    },
    muiTopToolbarProps: {
      sx: {
        width: '100%',
      },
    },

    muiSearchTextFieldProps: {
      placeholder: 'Przeszukaj obecny katalog',
      variant: 'outlined',
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
          Brak plików
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upuść pliki tutaj, aby je przesłać
        </Typography>
      </Box>
    ),
    renderRowActionMenuItems: ({ row, closeMenu }) => [
      row.original.type === 'file'
        ? [
            canOpenPreview(row.original) ? (
              <MRT_ActionMenuItem
                icon={<Visibility />}
                key="preview"
                label="Podgląd"
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
              label="Otwórz w nowej karcie"
              onClick={() => {
                handleOpenFileInNewTab((row.original as FileItem).url);
                closeMenu();
              }}
              table={table}
            />,
            <MRT_ActionMenuItem
              icon={<InfoOutline />}
              key="details"
              label="Szczegóły"
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
        label="Pobierz"
        onClick={() => {
          handleDownload([row.original]);
          closeMenu();
        }}
        table={table}
      />,
      <MRT_ActionMenuItem
        icon={<Edit />}
        key="edit"
        label="Zmień nazwę"
        onClick={() => {
          handleRename(row.original);
          closeMenu();
        }}
        table={table}
      />,
      <MRT_ActionMenuItem
        icon={<Delete color="error" />}
        key="delete"
        label="Usuń"
        onClick={() => {
          handleDelete([row.original]);
          closeMenu();
        }}
        table={table}
      />,
    ],
    renderTopToolbarCustomActions: ({ table }) => {
      const selectedRows = table
        .getSelectedRowModel()
        .flatRows.map((row) => row.original);
      return (
        <Box
          sx={{
            pl: 0.5,
          }}
        >
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              columnGap: 1,
              flexWrap: 'wrap',
            }}
          >
            {renderToolbarButtons(selectedRows)}
          </Box>
        </Box>
      );
    },
    renderTopToolbar: ({ table }) => {
      const selectedRows = table
        .getSelectedRowModel()
        .flatRows.map((row) => row.original);

      return (
        <Box sx={{ maxWidth: '100%' }}>
          <MRT_TopToolbar table={table} />

          <Box
            sx={{
              display: { xs: 'flex', sm: 'none' },
              gap: 2,
              padding: 1,
              flexWrap: 'wrap',
            }}
          >
            {renderToolbarButtons(selectedRows)}
          </Box>

          <Divider />

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              paddingRight: '10px',
              gap: 1,
              overflow: 'hidden',
              maxWidth: '100%',
              padding: '5px',
            }}
          >
            <Tooltip title="Wróć">
              <span>
                <IconButton
                  size="small"
                  aria-label="delete"
                  disabled={currentPath === baseDirectory}
                  onClick={() =>
                    changeCurrentPath(
                      currentPath.substring(0, currentPath.lastIndexOf('/'))
                    )
                  }
                >
                  <ArrowBack />
                </IconButton>
              </span>
            </Tooltip>

            <FileBreadcrumps
              path={currentPath}
              baseDirectory={baseDirectory}
              onClick={(path) => changeCurrentPath(path)}
            />
          </Box>
        </Box>
      );
    },
  });

  return (
    <Box sx={{ width: '100%' }}>
      {Object.keys(uploadProgress).length > 0 && (
        <Box
          sx={{ p: 2, border: '1px solid #ddd', borderRadius: '4px', mb: 2 }}
        >
          <Typography variant="h6" gutterBottom>
            Przesyłanie plików...
          </Typography>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <Box key={fileName} sx={{ mb: 1 }}>
              <Typography variant="body2">{fileName}</Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          ))}
        </Box>
      )}

      <Box ref={dropRef} sx={{ position: 'relative' }}>
        {isDragOver && (
          <Paper
            sx={{
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
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              border: '2px dashed #1976d2',
              borderRadius: '4px',
            }}
          >
            <Box
              sx={{
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                borderRadius: '10px',
              }}
            >
              <CloudUpload
                sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
              />
              <Typography variant="h6" color="primary.main">
                Upuść pliki tutaj, aby je przesłać
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Pliki zostaną przesłane do:{' '}
                {currentPath.replace(baseDirectory, 'Katalog główny')}
              </Typography>
            </Box>
          </Paper>
        )}
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
          <MaterialReactTable table={table} />
        </LocalizationProvider>
      </Box>
      <MoveItemsDialog
        open={moveDialogOpen}
        folders={destinationFolders}
        onClose={closeMoveDialog}
        onMove={handleMove}
        baseDirectory={baseDirectory}
        currentPath={currentPath}
      />
      <PreviewDialog
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

export default FirebaseFileBrowser;
