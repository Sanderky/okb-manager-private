import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
  Box,
  Typography,
  Stack,
  Divider,
  Tooltip,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useRef, useState } from 'react';
import {
  Add,
  CropFree,
  Error,
  OpenInNew,
  Remove,
  RotateLeft,
  RotateRight,
} from '@mui/icons-material';
import * as StorageService from '../../../entities/files/model/api';
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchContentRef,
} from 'react-zoom-pan-pinch';
import type { FileItem, FolderItem } from '../../../entities/files';

interface PreviewDialogProps {
  open: boolean;
  onClose: () => void;
  file: FileItem | FolderItem | File | null;
}

export const PreviewDialog = ({ open, onClose, file }: PreviewDialogProps) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const transformComponentRef = useRef<ReactZoomPanPinchContentRef>(null);

  useEffect(() => {
    if (open && file && file.type !== 'folder') {
      const createPreviewUrl = async () => {
        try {
          setIsLoading(true);
          setIsError(false);
          setRotation(0);

          let url: string | null = null;

          if (isFileObject(file)) {
            url = URL.createObjectURL(file);
          } else {
            url = await StorageService.getSignedUrl(file.path, 3600);
          }

          if (!url) {
            return;
          }

          setPreviewUrl(url);
        } catch (error) {
          console.error('Error creating preview URL:', error);
          setIsError(true);
        } finally {
          const fType = isFileObject(file)
            ? StorageService.getFileType(file.name)
            : StorageService.getFileType(file.name);
          if (fType === 'pdf') {
            setIsLoading(false);
          }
        }
      };

      createPreviewUrl();
    }

    return () => {
      if (previewUrl) {
        if (isFileObject(file)) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file]);

  const handleRotateLeft = () => {
    setRotation((prev) => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  const handleReset = () => {
    setRotation(0);
    if (transformComponentRef.current) {
      transformComponentRef.current.resetTransform();
    }
  };

  const handleClose = () => {
    setIsError(false);
    setIsLoading(true);
    setRotation(0);
    if (previewUrl) {
      if (isFileObject(file)) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    }
    onClose();
  };

  const handleDownloadOrOpen = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  if (!file || file.type === 'folder') return null;

  const fileType = StorageService.getFileType(file.name);

  const renderPreview = () => {
    if (isError) {
      return (
        <Stack direction={'column'} alignItems={'center'} spacing={1}>
          <Error color="error" fontSize="large" />
          <Typography color="error">
            Wystąpił błąd podczas wczytywania pliku
          </Typography>
        </Stack>
      );
    }

    switch (fileType) {
      case 'image':
        return (
          <>
            {isLoading && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'absolute',
                  zIndex: 10,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            {previewUrl && (
              <TransformWrapper
                ref={transformComponentRef}
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit
                wheel={{ step: 0.1 }}
              >
                <TransformComponent
                  wrapperStyle={{
                    width: '100%',
                    height: '100%',
                    display: isLoading ? 'none' : 'block',
                  }}
                  contentStyle={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    crossOrigin="anonymous"
                    src={previewUrl}
                    alt={file.name}
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                    onLoad={() => {
                      setIsLoading(false);
                    }}
                    onError={() => setIsError(true)}
                  />
                </TransformComponent>
              </TransformWrapper>
            )}
          </>
        );
      case 'pdf':
        return (
          previewUrl && (
            <iframe
              src={previewUrl}
              title={file.name}
              style={{ width: '100%', height: '100%', border: 'none' }}
              onError={() => setIsError(true)}
            />
          )
        );
      default:
        return (
          <Stack direction={'column'} alignItems={'center'} spacing={1}>
            <Error color="error" fontSize="large" />
            <Typography color="error">
              Podgląd dla tego typu pliku nie jest obsługiwany.
            </Typography>
            <Typography variant="caption">
              Pobierz plik, aby go otworzyć.
            </Typography>
          </Stack>
        );
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullScreen>
      <DialogTitle
        sx={{
          p: 0,
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            pl: { xs: 1, sm: 2 },
            pr: { xs: 1, sm: 2 },
          }}
        >
          <Typography
            sx={{ fontWeight: 500, flex: 1 }}
            textOverflow="ellipsis"
            noWrap={true}
            variant="subtitle1"
            textAlign={'left'}
          >
            {file.name}
          </Typography>

          <Stack
            direction={'row'}
            sx={{
              alignItems: 'center',
              justifyContent: 'flex-end',
              alignSelf: 'stretch',
            }}
          >
            {fileType === 'image' && (
              <Stack
                direction={'row'}
                alignItems="center"
                spacing={0.5}
                sx={{ mr: 1 }}
              >
                <Tooltip title="Przybliż">
                  <IconButton
                    onClick={() => transformComponentRef.current?.zoomIn()}
                    size="small"
                  >
                    <Add />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Oddal">
                  <IconButton
                    onClick={() => transformComponentRef.current?.zoomOut()}
                    size="small"
                  >
                    <Remove />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Resetuj widok">
                  <IconButton onClick={handleReset} size="small">
                    <CropFree />
                  </IconButton>
                </Tooltip>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                <Tooltip title="Obróć w lewo">
                  <IconButton onClick={handleRotateLeft} size="small">
                    <RotateLeft />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Obróć w prawo">
                  <IconButton onClick={handleRotateRight} size="small">
                    <RotateRight />
                  </IconButton>
                </Tooltip>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              </Stack>
            )}

            <Tooltip title={'Otwórz w nowej karcie'}>
              <IconButton
                onClick={handleDownloadOrOpen}
                size="small"
                sx={{ mr: 2 }}
              >
                <OpenInNew />
              </IconButton>
            </Tooltip>

            <IconButton aria-label="close" onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 0,
          // backgroundColor: 'background.default',
          backgroundColor: '#0d0d0d',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {renderPreview()}
      </DialogContent>
    </Dialog>
  );
};

function isFileObject(file: File | FileItem | FolderItem | null): file is File {
  return file instanceof File;
}
