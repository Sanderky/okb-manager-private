import React, { useState, useEffect } from 'react';
import { Button, Typography, Alert, Stack } from '@mui/material';
import 'dayjs/locale/pl';
import { getPreviousWeek } from '@/shared/lib/date';
import WeekSelector from '@/shared/ui/WeekSelector';
import BaseDialog from '@/shared/ui/BaseDialog';
import { useTranslation } from 'react-i18next';

interface CopyTableDialogProps {
  open: boolean;
  onClose: () => void;
  handleCopyFromSourceWeek: (sourceWeek: Date) => void;
  currentWeek: Date;
}

export const CopyTableDialog: React.FC<CopyTableDialogProps> = ({
  open,
  onClose,
  handleCopyFromSourceWeek,
  currentWeek,
}) => {
  const [weekToCopy, setWeekToCopy] = useState<Date>(
    getPreviousWeek(currentWeek)
  );

  useEffect(() => {
    if (open) setWeekToCopy(getPreviousWeek(currentWeek));
  }, [open, currentWeek]);

  const handleSave = () => {
    handleCopyFromSourceWeek(weekToCopy);
    onClose();
  };

  const { t } = useTranslation('workLogs');

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={t('dialogs.copyData.title')}
      showConfirm={false}
      actions={
        <Button onClick={handleSave} variant="contained">
          {t('dialogs.copyData.copy')}
        </Button>
      }
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={{ xs: 2, sm: 1 }}
      >
        <Typography>
          {t('dialogs.copyData.copyDataFromSelectedWeek')}
        </Typography>
        <WeekSelector value={weekToCopy} onChange={setWeekToCopy} />
      </Stack>
      <Alert severity="info" sx={{ mt: 2 }}>
        {t('dialogs.copyData.warning')}
      </Alert>
    </BaseDialog>
  );
};
