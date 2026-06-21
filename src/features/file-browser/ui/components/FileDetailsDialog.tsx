import { Box, Typography, Stack } from '@mui/material';
import 'dayjs/locale/pl';
import BaseDialog from '@/shared/ui/BaseDialog';
import type { FileItem } from '@/shared/model/types';
import { formatBytes } from '@/shared/lib/fileUtils';

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
