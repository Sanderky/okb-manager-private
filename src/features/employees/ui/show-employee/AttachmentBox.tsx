import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CircularProgress, Grid, IconButton } from '@mui/material';
import { FileUpload, HighlightOff } from '@mui/icons-material';
import { useDialogs } from '@/shared/ui/dialogs/useDialogs';
import { useState } from 'react';
import {
  useEmployeeAlerts,
  type Attachment,
  type Employee,
  type EmployeeAttachmentType,
} from '@/entities/employee';
import * as FilesApi from '@/shared/api/storage';
import { AttachmentItem } from '@/shared/ui/AttachmentItem';
import { UploadFilesDialog } from '@/shared/ui/UploadFilesDialog';
import { openFileInNewTab } from '@/shared/lib/browser';
import { canOpenPreview } from '@/shared/lib/fileUtils';
import type { FieldInfo } from '../../model/types';
import type useEmployeeAttachments from '../../model/services/useAttachment';
import { AttachmentDateBox } from './AttachmentDateBox';

interface AttachmentBoxProps {
  label: string;
  type: EmployeeAttachmentType;
  hook: ReturnType<typeof useEmployeeAttachments>;
  onPreview: (file: Attachment) => void;
  employee: Employee | null;
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
  const { alerts, isLoading: alertsLoading } = useEmployeeAlerts();
  const [isDragging, setIsDragging] = useState(false);
  const employeeAlerts = alerts.filter((a) => a.employeeId === employee?.id);
  const isLoading = hook.loadingType === type || alertsLoading;
  const dialogs = useDialogs();
  const uploadProgress = hook.uploadProgress;
  const files = hook.getAttachmentsByType(type);

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
          {dateFields.map(({ key, label }) => (
            <AttachmentDateBox
              key={key}
              dateKey={key}
              label={label}
              employeeData={employee}
              alerts={employeeAlerts}
            />
          ))}
        </Grid>
      )}
    </Box>
  );
};
