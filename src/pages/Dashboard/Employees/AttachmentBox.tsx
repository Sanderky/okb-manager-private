import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  type AlertsSettings,
  type Attachment,
  type Employee,
  type EmployeeAlert,
  type EmployeeAttachmentType,
} from '../../../types';
import {
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import * as StorageService from '../../../services/storage';
import {
  AttachFile,
  Delete,
  Download,
  FileUpload,
  HighlightOff,
  MoreHoriz,
  OpenInNew,
  Visibility,
} from '@mui/icons-material';
import { useDialogs } from '../../../hooks/useDialogs/useDialogs';
import useEmployeeAttachments from './useAttachment';
import dayjs from 'dayjs';
import { useEmployeeAlert } from '../../../context/EmployeeAlertContext';
import { useState } from 'react';
import type { FieldInfo } from './EmployeeShow';
import { openFileInNewTab } from '../../../services/storage';

const generateDateBox = (
  key: keyof Employee,
  label: string,
  employeeData: Employee | null,
  alerts: EmployeeAlert[] // ZMIANA: Przekazujemy listę alertów zamiast ustawień
) => {
  if (!employeeData) return null;

  const dateValue = employeeData[key];
  const isContractEndDate = key === 'contractEndDate';
  const isA1EndDate = key === 'a1EndDate';
  const isPermanent = isContractEndDate
    ? Boolean(employeeData.contractIsPermanent)
    : false;

  let displayValue: React.ReactNode;
  let activeAlert = null;

  if (isContractEndDate && isPermanent) {
    displayValue = 'Umowa na czas nieokreślony';
  } else if (dateValue instanceof Date) {
    displayValue = dayjs(dateValue).format('DD.MM.YYYY');

    const alertSuffix = isContractEndDate
      ? '_contract'
      : isA1EndDate
        ? '_a1'
        : '';

    if (alertSuffix) {
      activeAlert = alerts.find(
        (a) => a.id === `${employeeData.id}${alertSuffix}`
      );
    }
  } else {
    displayValue = <em className="text-gray-400">Brak</em>;
  }

  let dateStyles = '';
  if (activeAlert) {
    if (activeAlert.severity === 'error') {
      dateStyles = 'border-red-500/25! bg-red-500/10! text-red-700!';
    } else if (activeAlert.severity === 'warning') {
      dateStyles = 'border-amber-500/25! bg-amber-500/10! text-amber-600!';
    }
  } else if (isPermanent) {
    dateStyles = '!text-gray-700';
  }

  return (
    <Grid key={key} size={{ xs: 12 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="flex-start"
        alignItems={{ xs: 'flex-start', lg: 'center' }}
        spacing={{ xs: 1, lg: 2 }}
        sx={{ width: '100%' }}
      >
        <Typography variant="body2" className="font-medium">
          {label}:
        </Typography>
        <Typography
          variant="body2"
          className={`border-lightGray rounded border px-3 py-1 text-gray-700 ${dateStyles}`}
        >
          {displayValue}
        </Typography>
      </Stack>

      {activeAlert && (
        <Alert
          severity={activeAlert.severity}
          sx={{
            width: '100%',
            mt: 2,
            borderColor: `${activeAlert.severity}.main`,
            borderWidth: '1px',
          }}
        >
          <Typography variant="body2">{activeAlert.message}</Typography>
        </Alert>
      )}
    </Grid>
  );
};

interface AttachmentItemProps {
  file: Attachment | undefined | null;
  onDelete?: () => void;
  onDownload?: () => void;
  onShow?: () => void;
  onNameClick?: () => void;
  onNewCard?: () => void;
}

const AttachmentItem = ({
  file,
  onDelete,
  onDownload,
  onShow,
  onNewCard,
  onNameClick,
}: AttachmentItemProps) => {
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
          <Typography variant="body2">Brak załącznika</Typography>
        </Stack>
      </Box>
    );
  }

  const dateCreated = file.createdAt ? new Date(file.createdAt) : null;
  const canPreview = StorageService.canOpenPreview({
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
                <Visibility sx={{ color: 'text.secondary', mr: 1 }} /> Podgląd
              </MenuItem>
            )}
            {onNewCard && (
              <MenuItem
                onClick={(e) => {
                  onNewCard();
                  handleClose(e);
                }}
              >
                <OpenInNew sx={{ color: 'text.secondary', mr: 1 }} /> Otwórz w
                nowej karcie
              </MenuItem>
            )}
            {onDownload && (
              <MenuItem
                onClick={(e) => {
                  onDownload();
                  handleClose(e);
                }}
              >
                <Download sx={{ color: 'text.secondary', mr: 1 }} /> Pobierz
              </MenuItem>
            )}
            {onDelete && (
              <MenuItem
                onClick={(e) => {
                  onDelete();
                  handleClose(e);
                }}
              >
                <Delete color="error" sx={{ mr: 1 }} /> Usuń
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

interface AttachmentBoxProps {
  label: string;
  type: EmployeeAttachmentType;
  hook: ReturnType<typeof useEmployeeAttachments>;
  onPreview: (file: Attachment) => void;
  employee: Employee | null;
  // alertsSettings: AlertsSettings | undefined;
  dateFields?: FieldInfo[];
}

const AttachmentBox = ({
  label,
  type,
  hook,
  onPreview,
  employee,
  dateFields,
}: AttachmentBoxProps) => {
  const files = hook.getAttachmentsByType(type);
  const isLoading = hook.loadingType === type;
  const { alerts } = useEmployeeAlert();
  const employeeAlerts = alerts.filter((a) => a.employeeId === employee?.id);
  const dialogs = useDialogs();

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      Array.from(droppedFiles).forEach((file) => {
        hook.handleUpload(file, type);
      });
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => {
        hook.handleUpload(file, type);
      });

      e.target.value = '';
    }
  };

  const handleClickOnName = (fileToPreview: Attachment) => {
    console.log('handleClickOnName', fileToPreview);
    if (!fileToPreview) return;
    if (StorageService.canOpenPreview(fileToPreview)) {
      onPreview(fileToPreview);
    } else {
      handleNewTab(fileToPreview);
    }
  };

  const handleDelete = async (fileToDelete: Attachment) => {
    const confirm = await dialogs.confirm(
      <Box>
        <Typography mb={2}>
          Czy na pewno chcesz usunąć ten załącznik?
        </Typography>
        <Typography variant="caption">{fileToDelete.name}</Typography>
      </Box>,
      {
        severity: 'error',
        title: 'Usuwanie pliku',
        okText: 'Usuń',
        cancelText: 'Anuluj',
      }
    );
    if (confirm) {
      hook.handleDelete(fileToDelete, type);
    }
  };

  const handleDownload = async (fileToDownload: Attachment) => {
    if (fileToDownload && fileToDownload.path) {
      await StorageService.downloadFile(
        fileToDownload.path,
        fileToDownload.name
      );
    }
  };

  const handleNewTab = async (fileToOpen: Attachment) => {
    if (fileToOpen?.path) {
      await openFileInNewTab(fileToOpen.path);
    }
  };

  return (
    <Box
      className={`rounded-lg p-3 md:p-5 md:pb-3 ${isDragging ? 'bg-blue-100' : 'bg-blue-50/50'} ${isDragging ? 'border border-dashed border-blue-500' : 'border border-blue-700/25'}`}
      sx={{ position: 'relative' }}
      width={'100%'}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        mb={1.5}
        alignItems="center"
      >
        <Typography variant="subtitle1" className="text-baseline font-semibold">
          {label}
        </Typography>
        {isLoading ? (
          <CircularProgress size={20} sx={{ m: 0.5 }} />
        ) : (
          <IconButton
            size="small"
            component="label"
            sx={{
              p: 0,
            }}
          >
            <FileUpload color="primary" />

            <input type="file" multiple hidden onChange={handleUpload} />
          </IconButton>
        )}
      </Stack>

      {files && files.length > 0 ? (
        <Box
          sx={{
            maxHeight: '300px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {files.map((file) => (
            <AttachmentItem
              key={file.id}
              file={file}
              onShow={() => onPreview(file)}
              onDownload={() => handleDownload(file)}
              onNewCard={() => handleNewTab(file)}
              onDelete={() => handleDelete(file)}
              onNameClick={() => handleClickOnName(file)}
            />
          ))}
        </Box>
      ) : (
        <Box marginBottom={2}>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <HighlightOff className="text-gray-500" />
            <Typography variant="body2">Brak załączników</Typography>
          </Stack>
        </Box>
      )}

      {dateFields && (
        <Grid
          container
          spacing={2}
          className="border-t border-blue-700/25"
          sx={{ pt: 2, mt: 0 }}
        >
          {dateFields.map(({ key, label }) => {
            return generateDateBox(key, label, employee, employeeAlerts);
          })}
        </Grid>
      )}
    </Box>
  );
};

export default AttachmentBox;
