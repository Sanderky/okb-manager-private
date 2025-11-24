import { Alert, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { plPL } from '@mui/x-date-pickers/locales';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import BaseDialog, { ConfirmationDialog } from '../../../components/BaseDialog';
import type { Construction } from '../../../types';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateConstruction } from '../../../api/constructions';
import { useNavigate } from 'react-router-dom';

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
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [endDateValue, setEndDateValue] = useState(dayjs());
  const [endDateError, setEndDateError] = useState<string | null>(null);

  const notifications = useNotifications();

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { status: boolean; endDate?: Date | null }) =>
      updateConstruction(construction.id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['construction', construction.id],
      });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
    },
    onError: (error: Error) => {
      console.error('Update construction status error:', error);
      notifications.show('Wystąpił błąd podczas zmiany stanu budowy.', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    },
  });

  useEffect(() => {
    if (open) {
      setEndDateError(null);

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
        setEndDateError(
          'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.'
        );
        return;
      } else if (chosen.isAfter(dayjs().startOf('day'))) {
        setEndDateError('Data zakończenia nie może być z przyszłości.');
        return;
      }
    }

    onClose();
    updateStatusMutation.mutate(
      {
        status: false,
        endDate: chosen ? chosen.toDate() : new Date(),
      },
      {
        onSuccess: () => {
          navigate(`/constructions/${construction.id}`);
          notifications.show('Budowa została oznaczona jako zakończona.', {
            severity: 'success',
            autoHideDuration: 5000,
          });
        },
      }
    );
  }, [
    construction,
    endDateValue,
    updateStatusMutation,
    notifications,
    onClose,
    navigate,
  ]);

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      onConfirm={handleFinish}
      title="Zakończ budowę"
      confirmText="Zakończ budowę"
      confirmColor="warning"
      showCancel={false}
      loading={updateStatusMutation.isPending}
      disabled={cannotBeFinished}
    >
      <Stack spacing={2}>
        <Typography variant="body1">
          Wybierz datę zakończenia budowy <strong>{construction?.name}</strong>:
        </Typography>
        {construction?.startDate && (
          <Typography variant="body1" className="mb-2">
            Data rozpoczęcia:{' '}
            <strong>
              {dayjs(construction?.startDate).format('DD.MM.YYYY')}
            </strong>
          </Typography>
        )}
        <LocalizationProvider
          localeText={
            plPL.components.MuiLocalizationProvider.defaultProps.localeText
          }
          dateAdapter={AdapterDayjs}
          adapterLocale="pl"
        >
          <DatePicker
            openTo="month"
            views={['year', 'month', 'day']}
            label={'Data zakończenia'}
            disabled={cannotBeFinished}
            value={endDateValue}
            onChange={(v) => {
              setEndDateError(null);
              setEndDateValue(v ?? dayjs());
            }}
            minDate={dayjs(construction.startDate)}
            maxDate={dayjs()}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                error: !!endDateError,
                helperText: endDateError ?? '',
              },
              field: {
                clearable: false,
              },
            }}
          />
        </LocalizationProvider>
        {cannotBeFinished && (
          <Alert severity="warning">
            Budowa nie może zostać zakończona, ponieważ jeszcze się nie
            rozpoczęła.
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
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const notifications = useNotifications();

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { status: boolean; endDate?: Date | null }) =>
      updateConstruction(construction.id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['construction', construction.id],
      });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
    },
    onError: (error: Error) => {
      console.error('Update construction status error:', error);
      notifications.show('Wystąpił błąd podczas zmiany stanu budowy.', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    },
  });

  const handleResume = useCallback(() => {
    onClose();
    updateStatusMutation.mutate(
      {
        status: true,
        endDate: null,
      },
      {
        onSuccess: () => {
          navigate(`/constructions/${construction.id}`);
          notifications.show('Budowa została wznowiona.', {
            severity: 'success',
            autoHideDuration: 5000,
          });
        },
      }
    );
  }, [updateStatusMutation, notifications, onClose, construction, navigate]);

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      onConfirm={handleResume}
      title="Wznawianie budowy"
      message={
        <Typography variant="body1">
          Czy na pewno chcesz wznowić budowę{' '}
          <strong>{construction?.name}</strong>?
        </Typography>
      }
      confirmText="Wznów budowę"
      cancelText="Anuluj"
      confirmColor="success"
      showCancel={false}
      loading={updateStatusMutation.isPending}
    />
  );
};
