import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  useTheme,
  type Theme,
} from '@mui/material';
import { FileUpload, HighlightOff } from '@mui/icons-material';
import { useDialogs } from '@/shared/ui/dialogs/useDialogs';
import useEmployeeAttachments from '../model/useAttachment';
import dayjs from 'dayjs';
import { useState } from 'react';
import {
  getEmployeeAlerts,
  type Attachment,
  type Employee,
  type EmployeeAlert,
  type EmployeeAttachmentType,
} from '@/entities/employee';
import * as FilesApi from '@/shared/api/storage';
import { AttachmentItem } from '@/shared/ui/AttachmentItem';
import { UploadFilesDialog } from '@/shared/ui/UploadFilesDialog';
import type { FieldInfo } from '../model/types';
import { useQuery } from '@tanstack/react-query';
import { openFileInNewTab } from '@/shared/lib/browser';
import { canOpenPreview } from '@/shared/lib/fileUtils';

const generateDateBox = (
  key: keyof Employee,
  label: string,
  employeeData: Employee | null,
  alerts: EmployeeAlert[],
  theme: Theme
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

  let textColor = theme.palette.text.primary;
  let borderColor = theme.palette.text.primary;
  let bgColor = '';

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
    textColor = theme.palette.text.disabled;
    borderColor = theme.palette.text.disabled;
    displayValue = <em>Brak</em>;
  }

  if (activeAlert) {
    if (activeAlert.severity === 'error') {
      textColor = theme.palette.error.main;
      borderColor = theme.palette.error.main;
      // bgColor = alpha(theme.palette.error.main, 0.1);
      bgColor = '';
    } else if (activeAlert.severity === 'warning') {
      textColor = theme.palette.warning.main;
      borderColor = theme.palette.warning.main;
      // bgColor = alpha(theme.palette.warning.main, 0.1);
      bgColor = '';
    }
  } else if (isPermanent) {
    textColor = theme.palette.text.primary;
    borderColor = theme.palette.text.primary;
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
          className={`rounded px-3 py-1`}
          sx={{
            border: `1px solid ${borderColor}`,
            background: bgColor,
            color: textColor,
          }}
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

interface AttachmentBoxProps {
  label: string;
  type: EmployeeAttachmentType;
  hook: ReturnType<typeof useEmployeeAttachments>;
  onPreview: (file: Attachment) => void;
  employee: Employee | null;
  // alertsSettings: AlertsSettings | undefined;
  dateFields?: FieldInfo[];
}

export const AttachmentBox = ({
  label,
  type,
  hook,
  onPreview,
  employee,
  dateFields,
}: AttachmentBoxProps) => {
  const {
    data: alerts = [],
    isLoading: alertsLoading,
  } = useQuery({
    queryKey: ['alerts'],
    queryFn: getEmployeeAlerts,
  });
  const files = hook.getAttachmentsByType(type);
  const uploadProgress = hook.uploadProgress;
  const isLoading = hook.loadingType === type || alertsLoading;
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
      hook.handleUpload(droppedFiles, type);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      hook.handleUpload(e.target.files, type);

      e.target.value = '';
    }
  };

  const handleClickOnName = (fileToPreview: Attachment) => {
    if (!fileToPreview) return;
    if (canOpenPreview(fileToPreview)) {
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
      await FilesApi.downloadFile(fileToDownload.path, fileToDownload.name);
    }
  };

  const handleNewTab = async (fileToOpen: Attachment) => {
    if (fileToOpen?.path) {
      await openFileInNewTab(fileToOpen.path);
    }
  };

  const theme = useTheme();

  return (
    <Box
      className={`rounded-lg p-3 md:p-5 md:pb-3`}
      sx={(theme) => ({
        position: 'relative',
        background: isDragging
          ? theme.palette.accent.main
          : theme.palette.accent.light,
        border: isDragging
          ? `1px dashed ${theme.palette.accent.superDark}`
          : `1px solid ${theme.palette.accent.dark}`,
      })}
      width={'100%'}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <UploadFilesDialog
        isUploadDialogOpen={hook.isUploadDialogOpen}
        onClose={() => hook.setIsUploadDialogOpen(false)}
        uploadProgress={uploadProgress}
      />

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
            <HighlightOff sx={{ color: 'text.secondary' }} />
            <Typography variant="body2">Brak załączników</Typography>
          </Stack>
        </Box>
      )}

      {dateFields && (
        <Grid
          container
          spacing={2}
          sx={(theme) => ({
            pt: 2,
            mt: 0,
            borderTop: `1px solid ${theme.palette.accent.dark}`,
          })}
        >
          {dateFields.map(({ key, label }) => {
            return generateDateBox(key, label, employee, employeeAlerts, theme);
          })}
        </Grid>
      )}
    </Box>
  );
};
