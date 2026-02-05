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
  Paper,
  Stack,
  Divider,
  alpha,
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
  Check,
} from '@mui/icons-material';
import MoveItemsDialog from './MoveFilesDialog';
import { PreviewDialog } from '../../file-preview/components/FilePreviewDialog';

import useFileBrowser, { EMPTY_MAP } from '../hooks/useFileBrowser';
import 'dayjs/locale/pl';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MRT_Localization_PL } from 'material-react-table/locales/pl';
import BaseDialog from '../../../shared/ui/BaseDialog';
import * as StorageService from '../../../entities/files/model/api';
import {
  canOpenPreview,
  formatBytes,
  getFileType,
  openFileInNewTab,
} from '../../../entities/files/model/api';
import { FOLDER_TRANSLATIONS, type FileBrowserItem, type FileItem } from '../../../entities/files';
import UploadFilesDialog from './UploadFilesDialog';


const RenderFileImage = ({ file }: { file: FileBrowserItem }) => {
  if (file.type === 'folder')
    return <Folder color={file.isSystem ? 'primary' : 'inherit'} />;
  const fileType = getFileType(file.name);
  // if(fileType === 'pdf') return <PictureAsPdfOutlined/>
  // if (fileType === 'pdf') return <PdfIcon width={24} height={24} />;
  if (fileType === 'pdf') return <DescriptionOutlined />;
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
            file.createdAt
              ? new Date(file.createdAt).toLocaleString()
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
  employeesMap = EMPTY_MAP,
  constructionsMap = EMPTY_MAP,
}: {
  path: string;
  baseDirectory: string;
  onClick: (path: string) => void;
  employeesMap?: Record<string, string>;
  constructionsMap?: Record<string, string>;
}) => {
  const fullPathSegments = path.split('/').filter(Boolean);
  const baseSegments = baseDirectory.split('/').filter(Boolean);

  const getDisplayName = (segment: string) => {
    if (FOLDER_TRANSLATIONS[segment]) return FOLDER_TRANSLATIONS[segment];

    if (employeesMap[segment]) return employeesMap[segment];

    if (constructionsMap[segment]) return constructionsMap[segment];

    return segment;
  };

  let rootDisplayName = 'Katalog główny';

  if (baseSegments.length > 0) {
    const lastBasePart = baseSegments[baseSegments.length - 1];
    const translatedName = getDisplayName(lastBasePart);

    if (translatedName !== lastBasePart) {
      rootDisplayName = translatedName;
    }
  }

  const startIndex = baseSegments.length;
  const visibleSegments = fullPathSegments.slice(startIndex);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}
    >
      <Typography
        color={visibleSegments.length === 0 ? 'text.secondary' : 'text.primary'}
        variant="subtitle2"
        sx={{
          cursor: visibleSegments.length === 0 ? 'default' : 'pointer',
          '&:hover':
            visibleSegments.length > 0 ? { textDecoration: 'underline' } : {},
        }}
        onClick={() => visibleSegments.length > 0 && onClick(baseDirectory)}
      >
        {rootDisplayName}
      </Typography>

      {visibleSegments.length > 0 && (
        <Typography color="text.secondary" variant="body2">
          /
        </Typography>
      )}

      {visibleSegments.map((part, i) => {
        const isLast = i === visibleSegments.length - 1;

        const href = [...baseSegments, ...visibleSegments.slice(0, i + 1)].join(
          '/'
        );

        const displayName = getDisplayName(part);
        return (
          <React.Fragment key={i}>
            {isLast ? (
              <Typography
                color="text.secondary"
                variant="body2"
                sx={{ flexShrink: 0 }}
              >
                {displayName}
              </Typography>
            ) : (
              <Typography
                color="text.primary"
                variant="subtitle2"
                sx={{
                  flexShrink: 0,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
                onClick={() => onClick(href)}
              >
                {displayName}
              </Typography>
            )}

            {!isLast && (
              <Typography color="text.secondary" variant="body2">
                /
              </Typography>
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};

interface FileBrowserProps {
  baseDirectory: string;
  employeesMap?: Record<string, string>;
  constructionsMap?: Record<string, string>;
}

const FileBrowser = ({
  baseDirectory,
  employeesMap = {},
  constructionsMap = {},
}: FileBrowserProps) => {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] =
    useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef<number>(0);
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
    dragCounter.current++;
    if (dragCounter.current === 1) {
      setIsDragOver(true);
    }
  }, []);
  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;

    const currentTarget = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;

    if (!currentTarget.contains(relatedTarget) && dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragOver && dragCounter.current > 0) {
        setIsDragOver(true);
      }
    },
    [isDragOver]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
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

  const handleClikOnName = useCallback(
    async (item: FileBrowserItem) => {
      if (item.type === 'folder') {
        changeCurrentPath(item.path);
      } else if (StorageService.canOpenPreview(item)) {
        handleOpenPreview(item as FileItem);
      } else {
        await openFileInNewTab(item.path);
      }
    },
    [changeCurrentPath, handleOpenPreview]
  );

  const columns = useMemo<MRT_ColumnDef<FileBrowserItem>[]>(
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
        Cell: ({ renderedCellValue, cell, row }) => (
          <Stack direction={'row'} alignItems={'center'} spacing={1}>
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
                {renderedCellValue}
              </Typography>
            </Tooltip>
            {/* {row.original.isSystem && (
              <Chip label="Systemowy" size="small" variant="outlined" sx={{fontSize: '0.6rem'}} />
            )} */}
          </Stack>
        ),
      },
      {
        accessorKey: 'createdAt',
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
      // {
      //   accessorKey: 'contentType',
      //   header: 'Rodzaj',
      //   grow: false,
      //   size: 150,
      //   muiTableHeadCellProps: {
      //     sx: { display: { xs: 'none', md: 'table-cell' } },
      //   },
      //   muiTableBodyCellProps: {
      //     sx: { display: { xs: 'none', md: 'table-cell' } },
      //   },
      //   Cell: ({ row }) => {
      //     return (
      //       <Chip
      //         label={
      //           row.original.type === 'folder'
      //             ? 'folder'
      //             : (row.original.contentType ?? '-')
      //         }
      //         size="small"
      //         variant="outlined"
      //       />
      //     );
      //   },
      // },
    ],
    []
  );

  const renderToolbarButtons = (selectedRows: FileBrowserItem[]) => {
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
          Prześlij pliki
          <input type="file" hidden multiple onChange={handleFileUpload} />
        </Button>
        <Tooltip title="Prześlij pliki" key={'upload-phone'}>
          <span>
            <IconButton
              disabled={loading}
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

        <Tooltip title="Utwórz folder" key={'new-folder'}>
          <span>
            <IconButton disabled={loading} onClick={handleCreateFolder}>
              <CreateNewFolder />
            </IconButton>
          </span>
        </Tooltip>
        {hasAnySelection && [
          <Tooltip title={`Pobierz (${selectedRows.length})`} key={'download'}>
            <span>
              <IconButton
                disabled={!canModify || loading}
                onClick={() => handleDownload(selectedRows)}
              >
                <Download />
              </IconButton>
            </span>
          </Tooltip>,
          <Tooltip title={`Przenieś (${selectedRows.length})`} key={'move'}>
            <span>
              <IconButton
                disabled={!canModify || loading}
                onClick={() => openMoveDialog(selectedRows)}
              >
                <DriveFileMove />
              </IconButton>
            </span>
          </Tooltip>,
          <Tooltip title={`Usuń (${selectedRows.length})`} key={'delete'}>
            <span>
              <IconButton
                disabled={!canModify || loading}
                onClick={() => handleDelete(selectedRows)}
              >
                <Delete />
              </IconButton>
            </span>
          </Tooltip>,
        ]}
      </>
    );
  };

  const table = useMaterialReactTable({
    localization: MRT_Localization_PL,
    //pagination
    // enablePagination: false,
    // enableBottomToolbar: false,
    // enableStickyHeader: true,

    //scroll
    // enableStickyHeader: true,
    // enablePagination: false,
    // enableBottomToolbar: false,
    //
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
    state: {
      rowSelection,
      showSkeletons: loading,
      // showProgressBars: loading,
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
        height: '100%',
        maxHeight: '100%',
        width: '100%',
        backgroundColor: 'background.default',
      },
    },
    muiTableBodyCellProps: {
      sx: {},
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

    displayColumnDefOptions: {
      'mrt-row-actions': {
        header: '',
        grow: false,
      },
    },
    positionToolbarAlertBanner: 'none',
    muiTableBodyRowProps: ({ row }) => ({
      onClick: (e) => {
        const target = e.target as HTMLElement;

        if (target.closest('button') || target.closest('input')) {
          return;
        }

        if (window.getSelection()?.toString()) {
          return;
        }

        handleClikOnName(row.original);
      },
      sx: (theme) => ({
        cursor: 'pointer',
        backgroundColor: theme.palette.background.paper,
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
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
      placeholder: 'Przeszukaj obecny katalog',
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
          Brak plików
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upuść pliki tutaj, aby je przesłać
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
                  openFileInNewTab((row.original as FileItem).path);
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
        !isSystemItem && (
          <MRT_ActionMenuItem
            icon={<Edit />}
            key="edit"
            label="Zmień nazwę"
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
            label="Usuń"
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
              alignItems: 'center',
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
            {renderToolbarButtons(selectedRows)}
          </Box>

          <Divider />

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              paddingRight: '10px',
              gap: 1,
              maxWidth: '100%',
              pl: 1,
              py: 0.5,
              height: '40px',
              bgcolor: isSelectionMode
                ? 'rgba(25, 118, 210, 0.08)'
                : 'transparent',
            }}
          >
            {isSelectionMode ? (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                width="100%"
                sx={{ pr: 1 }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Check color="primary" sx={{ fontSize: 20 }} />
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    color="primary.main"
                  >
                    Wybrano: {selectedRows.length} z {totalElementsCount}
                  </Typography>
                </Stack>

                <Button
                  size="small"
                  onClick={() => table.resetRowSelection()}
                  sx={{ textTransform: 'none' }}
                >
                  Anuluj
                </Button>
              </Stack>
            ) : (
              <>
                <Tooltip title="Wróć">
                  <span>
                    <IconButton
                      size="small"
                      aria-label="back"
                      disabled={currentPath === baseDirectory}
                      onClick={() =>
                        changeCurrentPath(
                          currentPath.substring(0, currentPath.lastIndexOf('/'))
                        )
                      }
                    >
                      <ArrowBack fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                <FileBreadcrumps
                  path={currentPath}
                  baseDirectory={baseDirectory}
                  onClick={(path) => changeCurrentPath(path)}
                  employeesMap={employeesMap}
                  constructionsMap={constructionsMap}
                />
              </>
            )}
          </Box>
        </Box>
      );
    },
  });
  const elementsCount = table.getPrePaginationRowModel().rows.length;
  const getElementsText = () => {
    if (elementsCount === 1) return 'element';
    if (elementsCount > 1 && elementsCount < 5) return 'elementy';
    return 'elementów';
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
              sx={{
                lineHeight: 1,
              }}
            >{`${elementsCount} ${getElementsText()}`}</Typography>
          </Stack>
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

export default FileBrowser;
