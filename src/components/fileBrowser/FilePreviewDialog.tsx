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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FileItem, FolderItem } from '../../types';
import { Add, CropFree, Error, Remove, RotateLeft, RotateRight } from '@mui/icons-material';
import * as StorageService from '../../services/storage';

const ZoomStep = 0.2;
const MaxZoom = 2.0;
const MinZoom = 0.2;

interface PreviewDialogProps {
  open: boolean;
  onClose: () => void;
  file: FileItem | FolderItem | File | null;
}

export const PreviewDialog = ({ open, onClose, file }: PreviewDialogProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (open && file && file.type !== 'folder') {
      const createPreviewUrl = async () => {
        try {
          setIsLoading(true);
          setIsError(false);

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
  }, [open, file]);

  useEffect(() => {
    if (open && file) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [open, file]);

  const handleScaleUp = () => {
    setScale((prev) => {
      const newScale = prev + ZoomStep;
      if (newScale > MaxZoom) return MaxZoom;
      return Math.round(newScale * 10) / 10;
    });
  };

  const handleScaleDown = () => {
    setScale((prev) => {
      const newScale = prev - ZoomStep;
      if (newScale < MinZoom) return MinZoom;
      return Math.round(newScale * 10) / 10;
    });
  };

  const handleRotateLeft = () => {
    setRotation((prev) => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0)
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;

    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = { ...position };

    if (imageRef.current) {
      imageRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || scale <= 1) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      const newX = positionStartRef.current.x + deltaX;
      const newY = positionStartRef.current.y + deltaY;

      setPosition({
        x: newX,
        y: newY,
      });
    },
    [isDragging, scale]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    if (imageRef.current) {
      imageRef.current.style.cursor = scale > 1 ? 'grab' : 'default';
    }
  }, [isDragging, scale]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleClose = () => {
    setIsError(false);
    setIsLoading(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    if (previewUrl) {
      if (isFileObject(file)) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    }
    onClose();
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
                }}
              >
                <CircularProgress />
              </Box>
            )}
            {previewUrl && (
              <img
                crossOrigin="anonymous"
                ref={imageRef}
                src={previewUrl}
                alt={file.name}
                style={{
                  scale: scale,
                  transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  maxHeight: '100%',
                  maxWidth: '100%',
                  display: isLoading ? 'none' : 'block',
                  cursor:
                    scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  transition: isDragging ? 'none' : 'transform 0.1s ease',
                  userSelect: 'none',
                }}
                onLoad={() => setIsLoading(false)}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleReset}
                onError={() => setIsError(true)}
              />
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
          </Stack>
        );
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullScreen>
      <DialogTitle sx={{ p: 0 }}>
        <Stack
          direction={'row'}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            pl: { xs: 1, sm: 3 },
            pr: { xs: 1, sm: 3 },
          }}
        >
          <Typography
            sx={{ fontWeight: 500 }}
            textOverflow="ellipsis"
            noWrap={true}
          >
            {file.name}
          </Typography>

          {fileType === 'image' && (
            <Stack
              direction={'row'}
              sx={{ alignItems: 'center', display: { xs: 'none', sm: 'flex' } }}
            >
              <Typography sx={{ minWidth: '60px', textAlign: 'center' }}>
                {Math.round(scale * 100)}%
              </Typography>

              <Stack direction={'row'}>
                <IconButton
                  onClick={handleScaleUp}
                  disabled={scale >= MaxZoom}
                  size="small"
                >
                  <Add />
                </IconButton>

                {/* <Divider orientation="vertical" flexItem /> */}

                <IconButton
                  onClick={handleScaleDown}
                  disabled={scale <= MinZoom}
                  size="small"
                >
                  <Remove />
                </IconButton>

                <Divider orientation="vertical" flexItem />

                <Tooltip title="Resetuj zoom i pozycję">
                  <IconButton onClick={handleReset} size="small">
                    <CropFree />
                  </IconButton>
                </Tooltip>

                <Divider orientation="vertical" flexItem />

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
              </Stack>
            </Stack>
          )}

          <IconButton aria-label="close" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={theme => ({
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 0,
          backgroundColor: theme.palette.background.default,
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'default',
          position: 'relative',
        })}
        onMouseDown={(e) => e.preventDefault()}
      >
        {renderPreview()}
      </DialogContent>
    </Dialog>
  );
};

function isFileObject(file: File | FileItem | FolderItem | null): file is File {
  return file instanceof File;
}
