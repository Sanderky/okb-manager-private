import { Alert, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import BaseDialog, { ConfirmationDialog } from '@/shared/ui/BaseDialog';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type Construction } from '@/entities/construction';
import { useChangeConstructionStatus } from '../model/services/useChangeConstructionStatus';

interface FinishConstructionProps {
  construction: Construction;
  onClose: () => void;
  open: boolean;
}

export const FinishConstruction = ({
  construction,
  onClose,
  open,
}: FinishConstructionProps) => {
  const { t } = useTranslation('constructions');
  const navigate = useNavigate();

  const [endDateValue, setEndDateValue] = useState(dayjs());
  const [endDateErrorKey, setEndDateErrorKey] = useState<string | null>(null);

  const notifications = useNotifications();

  const { changeConstructionStatus, isPending } = useChangeConstructionStatus();

  useEffect(() => {
    if (open) {
      setEndDateErrorKey(null);

      let initialEndDate;
      if (construction?.endDate) {
        initialEndDate = dayjs(construction.endDate);
      } else {
        initialEndDate = dayjs();
      }

      setEndDateValue(initialEndDate);
    }
  }, [construction, open]);

  const cannotBeFinished = Boolean(
    !construction.startDate ||
    dayjs(construction.startDate).isAfter(dayjs().startOf('day'))
  );

  const handleFinish = useCallback(() => {
    const start = construction?.startDate
      ? dayjs(construction.startDate).startOf('day')
      : null;
    const chosen = endDateValue ? endDateValue.startOf('day') : null;

    if (start && chosen) {
      if (chosen.isBefore(start)) {
        setEndDateErrorKey('validation.endDateBeforeStart');
        return;
      } else if (chosen.isAfter(dayjs().startOf('day'))) {
        setEndDateErrorKey('validation.endDateInFuture');
        return;
      }
    }

    onClose();
    changeConstructionStatus(
      construction.id,
      false,
      chosen ? chosen.toDate() : new Date(),
      () => {
        navigate(`/constructions/${construction.id}`);
        notifications.show(t('notifications.finished'), {
          severity: 'success',
          autoHideDuration: 5000,
        });
      },
      () => {
        notifications.show(t('notifications.statusError'), {
          severity: 'error',
          autoHideDuration: 5000,
        });
      }
    );
  }, [
    construction,
    endDateValue,
    notifications,
    onClose,
    navigate,
    changeConstructionStatus,
    t,
  ]);

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      onConfirm={handleFinish}
      title={t('dialogs.finish.title')}
      confirmText={t('dialogs.finish.confirmBtn')}
      confirmColor="warning"
      showCancel={false}
      loading={isPending}
      disabled={cannotBeFinished}
    >
      <Stack spacing={2}>
        <Typography variant="body1">
          {t('dialogs.finish.prompt')} <strong>{construction?.name}</strong>:
        </Typography>
        {construction?.startDate && (
          <Typography variant="body1" className="mb-2">
            {t('dialogs.finish.startDateLabel')}{' '}
            <strong>
              {dayjs(construction?.startDate).format('DD.MM.YYYY')}
            </strong>
          </Typography>
        )}

        <DatePicker
          openTo="month"
          views={['year', 'month', 'day']}
          label={t('dialogs.finish.endDateLabel')}
          disabled={cannotBeFinished}
          value={endDateValue}
          onChange={(v) => {
            setEndDateErrorKey(null);
            setEndDateValue(v ?? dayjs());
          }}
          minDate={dayjs(construction.startDate)}
          maxDate={dayjs()}
          slotProps={{
            textField: {
              size: 'small',
              fullWidth: true,
              error: !!endDateErrorKey,
              helperText: endDateErrorKey ? t(endDateErrorKey) : '',
            },
            field: { clearable: false },
          }}
        />

        {cannotBeFinished && (
          <Alert severity="warning">
            {t('dialogs.finish.cannotFinishAlert')}
          </Alert>
        )}
      </Stack>
    </BaseDialog>
  );
};

interface ResumeConstructionProps {
  open: boolean;
  onClose: () => void;
  construction: Construction;
}
export const ResumeConstruction = ({
  open,
  onClose,
  construction,
}: ResumeConstructionProps) => {
  const { t } = useTranslation(['constructions', 'common']);
  const navigate = useNavigate();

  const notifications = useNotifications();
  const { changeConstructionStatus, isPending } = useChangeConstructionStatus();

  const handleResume = useCallback(() => {
    onClose();
    changeConstructionStatus(
      construction.id,
      true,
      undefined,
      () => {
        navigate(`/constructions/${construction.id}`);
        notifications.show(t('notifications.resumed'), {
          severity: 'success',
          autoHideDuration: 5000,
        });
      },
      () => {
        notifications.show(t('notifications.statusError'), {
          severity: 'error',
          autoHideDuration: 5000,
        });
      }
    );
  }, [
    changeConstructionStatus,
    notifications,
    onClose,
    construction,
    navigate,
    t,
  ]);

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      onConfirm={handleResume}
      title={t('dialogs.resume.title')}
      message={
        <Typography variant="body1">
          {t('dialogs.resume.prompt')} <strong>{construction?.name}</strong>?
        </Typography>
      }
      confirmText={t('dialogs.resume.confirmBtn')}
      cancelText={t('common:buttons.cancel')}
      confirmColor="success"
      showCancel={false}
      loading={isPending}
    />
  );
};
