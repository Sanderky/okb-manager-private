import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CalendarMonth,
  Person,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import BaseDialog from '@/shared/ui/BaseDialog';
import { getDateStr } from '@/shared/lib/string';
import type { Employee } from '@/entities/employee';
import type { CalendarEvent } from '../../model/types';
import { VacationForm } from './components/VacationForm';

const VacationDetails: React.FC<{
  event: CalendarEvent;
  onNavigateToEmployee: () => void;
}> = ({ event, onNavigateToEmployee }) => {
  const { t } = useTranslation('vacations');

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <Tooltip title={t('dialogs.editVacation.details.navigateToEmployee')}>
          <IconButton onClick={onNavigateToEmployee} sx={{ p: 0 }}>
            <Person color="action" fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography variant="subtitle2" color="text.secondary">
          {event.employeeName ?? ''}{' '}
          {!event.employeeActive && `(${t('dialogs.editVacation.details.inactive')})`}
        </Typography>
      </Stack>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        color="text.secondary"
      >
        <CalendarMonth fontSize="small" />
        <Typography variant="body2" fontWeight={500}>
          {getDateStr(event.startDate, event.endDate, true, t)}
        </Typography>
      </Stack>
      {event.description && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('dialogs.editVacation.details.description')}
          </Typography>
          <Typography>
            {event.description || t('dialogs.editVacation.details.noDescription')}
          </Typography>
        </Box>
      )}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {t('dialogs.editVacation.details.colorLabel')}
        </Typography>
        <Box
          sx={{
            width: 50,
            height: 25,
            bgcolor: event.color || '#ccc',
            borderRadius: 1,
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        />
      </Box>
    </Stack>
  );
};

interface EditVacationDialogProps {
  open: boolean;
  currentEvent: CalendarEvent;
  validationError: string;
  employees: Employee[];
  handleModalClose: () => void;
  handleDeleteEvent: () => void;
  handleEditEvent: (eventToSave: CalendarEvent) => void;
  loading?: boolean;
  onBack?: () => void;
  canGoBack?: boolean;
  handleResetError?: () => void;
}

export const EditVacationDialog: React.FC<EditVacationDialogProps> = ({
  open,
  currentEvent,
  validationError,
  employees,
  handleModalClose,
  handleDeleteEvent,
  handleEditEvent,
  loading = false,
  onBack,
  canGoBack = false,
  handleResetError,
}) => {
  const { t } = useTranslation('vacations');
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [internalEvent, setInternalEvent] =
    useState<CalendarEvent>(currentEvent);

  useEffect(() => {
    if (open) {
      setInternalEvent(currentEvent);
      setIsEditing(false);
    }
  }, [open, currentEvent]);

  const handleStartEditing = () => {
    setInternalEvent(currentEvent);
    setIsEditing(true);
  };
  const handleCancelEditing = () => {
    setInternalEvent(currentEvent);
    setIsEditing(false);
    if (handleResetError) handleResetError();
  };

  return (
    <BaseDialog
      open={open}
      onClose={handleModalClose}
      title={
        <Stack direction="row" alignItems="center" spacing={1}>
          {canGoBack && onBack && (
            <IconButton
              onClick={onBack}
              size="small"
              sx={{ ml: -1, color: 'inherit' }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6">
            {isEditing
              ? t('dialogs.editVacation.titleEdit')
              : t('dialogs.editVacation.titleDetails')}
          </Typography>
        </Stack>
      }
      loading={loading}
      disabled={
        isEditing && (!internalEvent.employeeId || !internalEvent.color)
      }
      actions={
        isEditing ? (
          <>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleCancelEditing}
              disabled={loading}
              sx={{ mr: 'auto' }}
            >
              {t('dialogs.editVacation.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={() => handleEditEvent(internalEvent)}
              disabled={loading}
            >
              {t('dialogs.editVacation.saveChanges')}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteEvent}
              disabled={loading}
              sx={{ mr: 'auto' }}
            >
              {t('dialogs.editVacation.delete')}
            </Button>
            <Button
              variant="outlined"
              onClick={handleStartEditing}
              disabled={loading}
            >
              {t('dialogs.editVacation.edit')}
            </Button>
          </>
        )
      }
    >
      {isEditing ? (
        <VacationForm
          isNew={false}
          currentEvent={internalEvent}
          setEvent={(upd) => setInternalEvent((p) => ({ ...p, ...upd }))}
          employees={employees}
          validationError={validationError}
          loading={loading}
        />
      ) : (
        <VacationDetails
          event={internalEvent}
          onNavigateToEmployee={() =>
            currentEvent.employeeId &&
            navigate(`/employees/${currentEvent.employeeId}`)
          }
        />
      )}
    </BaseDialog>
  );
};
