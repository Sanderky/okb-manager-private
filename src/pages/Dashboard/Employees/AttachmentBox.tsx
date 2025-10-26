import { HighlightOff, MoreHoriz } from '@mui/icons-material';
import {
  Typography,
  Chip,
  IconButton,
  Stack,
  Box,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  canOpenPreview,
  formatBytes,
} from '../../../components/fileBrowser/FileBrowserHelpers';
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
  //  const [open, setOpen] = useState(false)
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    // setOpen(true)
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (event: React.MouseEvent) => {
    // event.stopPropagation()
    event.stopPropagation();
    setAnchorEl(null);
    // setOpen(false)
  };

  if (!file) {
    return (
      <Box className="border-lightGray rounded-lg border p-2" marginBottom={2}>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <HighlightOff className="text-gray-500" />
          <Typography variant="body2">Brak załącznika</Typography>
        </Stack>
      </Box>
    );
  }

  const dateCreated = file.timeCreated && new Date(file.timeCreated);

  return (
    <Box
      className="border-lightGray rounded-lg border p-2"
      marginBottom={2}
      onClick={() => {
        if (canOpenPreview(file) && onShow) onShow();
      }}
      sx={{
        position: 'relative',
        transition: 'box-shadow 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
        },
      }}
    >
      <Stack direction={'row'}>
        <Box flexGrow={1}>
          <Stack direction={'row'}>
            {/* <AttachFile/> */}
            <Typography variant="body2" noWrap>
              {file.name}
            </Typography>
          </Stack>
          {dateCreated && (
            <Typography marginTop={1} variant="caption" color="text.secondary">
              Dodano: {dateCreated.toLocaleString()}
            </Typography>
          )}

          <Box sx={{ mt: 1 }}>
            {file.size && (
              <Chip
                label={formatBytes(file.size)}
                size="small"
                variant="outlined"
                sx={{ mr: 1 }}
              />
            )}
            {file.contentType && (
              <Chip label={file.contentType} size="small" variant="outlined" />
            )}
          </Box>
        </Box>
        <Box>
          <IconButton sx={{ marginLeft: 'auto' }} onClick={handleClick}>
            <MoreHoriz />
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
        </Box>
        {/* <Stack direction={'column'} justifyContent={'center'}>

                    <Box>
                      {onShow && canOpenPreview(file) && (

                      <Tooltip title={`Podgląd`}>
                        <IconButton
                        onClick={onShow}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      )}
                      {onDownload && (

                      <Tooltip title={`Pobierz`}>
                        <IconButton
                        onClick={onDownload}
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                      )}
                      {onDelete && <Tooltip title={`Usuń`}>
                        <IconButton
                        onClick={onDelete}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>}
                    </Box>
                  </Stack> */}
      </Stack>
    </Box>
  );
};

export default AttachmentBox;

// <Box className="border-lightGray rounded-lg border p-2" marginBottom={2} sx={{ position: 'relative' }}>

//                 <Stack direction={'row'}>
//                   <Box flexGrow={1}>
//                     <Stack direction={'row'}>
//                     {/* <AttachFile/> */}
//                     <Typography  variant="body2" sx={{}}>{file.name}</Typography>
//                     </Stack>
//                       {dateCreated && (
//                         <Typography marginTop={1} variant="caption" color="text.secondary">
//                           Dodano: {dateCreated.toLocaleString()}
//                         </Typography>
//                       )}

//                     <Box sx={{ mt: 1 }}>
//                       {file.size && (

//                       <Chip
//                         label={formatBytes(file.size)}
//                         size="small"
//                         variant="outlined"
//                         sx={{ mr: 1 }}
//                       />
//                       )}
//                       {file.contentType && (

//                         <Chip
//                           label={file.contentType}
//                           size="small"
//                           variant="outlined"
//                         />
//                       )}
//                     </Box>
//                   </Box>
//                   <Stack direction={'column'} justifyContent={'center'}>

//                     <Box>
//                       {onShow && canOpenPreview(file) && (

//                       <Tooltip title={`Podgląd`}>
//                         <IconButton
//                         onClick={onShow}
//                         >
//                           <Visibility />
//                         </IconButton>
//                       </Tooltip>
//                       )}
//                       {onDownload && (

//                       <Tooltip title={`Pobierz`}>
//                         <IconButton
//                         onClick={onDownload}
//                         >
//                           <Download />
//                         </IconButton>
//                       </Tooltip>
//                       )}
//                       {onDelete && <Tooltip title={`Usuń`}>
//                         <IconButton
//                         onClick={onDelete}
//                         >
//                           <Delete />
//                         </IconButton>
//                       </Tooltip>}
//                     </Box>
//                   </Stack>
//                 </Stack>
//               </Box>
