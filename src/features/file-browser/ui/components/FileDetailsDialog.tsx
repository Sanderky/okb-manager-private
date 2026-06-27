import { Box, Typography, Stack } from '@mui/material';
import BaseDialog from '@/shared/ui/BaseDialog';
import type { FileItem } from '@/shared/model/types';
import { formatBytes } from '@/shared/lib/fileUtils';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

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
  const { t } = useTranslation('fileBrowser');

  if (!file) return null;

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={t('details.title')}
      showConfirm={false}
    >
      <Stack
        direction={'column'}
        alignItems={'flex-start'}
        spacing={{ xs: 2, sm: 1 }}
      >
        <FileDetailsItem title={t('details.name')} value={file.name} />

        <FileDetailsItem
          title={t('details.added')}
          value={
            file.createdAt
              ? dayjs(file.createdAt).format('DD.MM.YYYY, HH:mm')
              : t('details.noData')
          }
        />
        <FileDetailsItem
          title={t('details.size')}
          value={
            file.size ? formatBytes(file.size as number) : t('details.noData')
          }
        />
        <FileDetailsItem
          title={t('details.type')}
          value={file.contentType ?? t('details.noData')}
        />
      </Stack>
    </BaseDialog>
  );
};
