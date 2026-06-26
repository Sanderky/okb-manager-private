import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, Typography, Chip, Box, Button, Divider } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import ConstructionIcon from '@mui/icons-material/Construction';
import BaseDialog from '@/shared/ui/BaseDialog';
import { getDateStr } from '@/shared/lib/string';
import { getCategoryLabel, useEventColor } from '@/entities/events';
import type { Construction } from '@/entities/construction';
import type { Employee } from '@/entities/employee';
import type { UiCalendarEvent } from '../../model/types';
import { EventForm } from './components/EventForm';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const EventDetails: React.FC<{
  event: Partial<UiCalendarEvent>;
  employees: Employee[];
  constructions: Construction[];
}> = ({ event, employees, constructions }) => {
  const { t } = useTranslation(['calendar', 'common']);

  const navigate = useNavigate();
  const handleEmployeeClick = (id: string) => navigate(`/employees/${id}`);
  const handleConstructionClick = (id: string) =>
    navigate(`/constructions/${id}`);

  const assignedEmployees = employees.filter((e) =>
    event.employeeIds?.includes(e.id)
  );
  const assignedConstructions = constructions.filter((c) =>
    event.constructionIds?.includes(c.id)
  );

  return (
    <Stack spacing={2.5} sx={{ mt: 1 }}>
      <Stack spacing={1}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          gap={1}
        >
          <Chip
            label={getCategoryLabel(event.category || 'info')}
            size="small"
            variant="outlined"
            sx={{ minWidth: '50px' }}
          />
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            color="text.secondary"
          >
            <CalendarMonthIcon fontSize="small" />
            <Typography variant="body2" fontWeight={500}>
              {getDateStr(
                event.startDate ? dayjs(event.startDate) : undefined,
                event.endDate ? dayjs(event.endDate) : undefined,
                true
              )}
            </Typography>
          </Stack>
        </Stack>
        <Divider />
        <Box>
          <Typography variant="subtitle1" fontWeight={500} gutterBottom>
            {event.title || t('calendar:dialogs.editEvent.noTitle')}
          </Typography>
          {event.description ? (
            <Typography
              variant="body2"
              sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}
            >
              {event.description}
            </Typography>
          ) : (
            <Typography
              variant="body2"
              color="text.disabled"
              fontStyle="italic"
            >
              {t('calendar:dialogs.editEvent.noDescription')}
            </Typography>
          )}
        </Box>
      </Stack>

      {assignedEmployees.length > 0 && (
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <PersonIcon color="action" fontSize="small" />
            <Typography variant="subtitle2" color="text.secondary">
              {t('calendar:dialogs.editEvent.assignedEmployees')}
            </Typography>
          </Stack>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {assignedEmployees.map((emp) => (
              <Chip
                key={emp.id}
                label={emp.name}
                variant="outlined"
                size="small"
                onClick={() => handleEmployeeClick(emp.id)}
                sx={{
                  cursor: 'pointer',
                  ':hover': { scale: '1.05' },
                  textDecoration: emp.status ? '' : 'line-through',
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {assignedConstructions.length > 0 && (
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <ConstructionIcon color="action" fontSize="small" />
            <Typography variant="subtitle2" color="text.secondary">
              {t('calendar:dialogs.editEvent.assignedConstructions')}
            </Typography>
          </Stack>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {assignedConstructions.map((constr) => (
              <Chip
                key={constr.id}
                label={constr.name}
                variant="outlined"
                size="small"
                onClick={() => handleConstructionClick(constr.id)}
                sx={{
                  cursor: 'pointer',
                  ':hover': { transform: 'scale(1.05)' },
                  textDecoration: constr.status ? '' : 'line-through',
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Stack>
  );
};

interface EditEventDialogProps {
  currentEvent: Partial<UiCalendarEvent>;
  setCurrentEvent: React.Dispatch<
    React.SetStateAction<Partial<UiCalendarEvent>>
  >;
  validationError: string;
  employees: Employee[];
  constructions: Construction[];
  handleResetError: () => void;
  handleModalClose: () => void;
  open: boolean;
  handleDeleteEvent: () => void;
  handleEditEvent: (eventData: Partial<UiCalendarEvent>) => void;
  loading?: boolean;
}

export const EditEventDialog: React.FC<EditEventDialogProps> = ({
  open,
  currentEvent,
  handleResetError,
  employees,
  constructions,
  validationError,
  handleModalClose,
  handleDeleteEvent,
  handleEditEvent,
  loading,
}) => {
  const { t } = useTranslation(['calendar', 'common']);

  const [isEditing, setIsEditing] = useState(false);
  const [internalEvent, setInternalEvent] =
    useState<Partial<UiCalendarEvent>>(currentEvent);
  const { getEventColor, getEventTextColor } = useEventColor();

  useEffect(() => {
    if (open) {
      setInternalEvent(currentEvent);
      setIsEditing(false);
    }
  }, [open, currentEvent]);

  const handleUpdateInternal = (updates: Partial<UiCalendarEvent>) =>
    setInternalEvent((prev) => ({ ...prev, ...updates }));
  const handleStartEditing = () => {
    setInternalEvent(currentEvent);
    setIsEditing(true);
  };
  const handleCancelEditing = () => {
    setInternalEvent(currentEvent);
    setIsEditing(false);
    handleResetError();
  };

  return (
    <BaseDialog
      open={open}
      onClose={handleModalClose}
      titleSx={{
        background: getEventColor(internalEvent.color ?? 'blue'),
        '& .MuiButtonBase-root': {
          color: getEventTextColor(internalEvent.color ?? 'blue'),
        },
      }}
      title={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant="h6"
            sx={{ color: getEventTextColor(internalEvent.color ?? 'blue') }}
          >
            {isEditing
              ? t('calendar:dialogs.editEvent.titleEditing')
              : t('calendar:dialogs.editEvent.titleViewing')}
          </Typography>
        </Stack>
      }
      loading={loading}
      actions={
        isEditing ? (
          <>
            <Button
              onClick={handleCancelEditing}
              disabled={loading}
              color="inherit"
              variant="outlined"
              sx={{ mr: 'auto' }}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={() => handleEditEvent(internalEvent)}
              disabled={loading}
            >
              {t('common:buttons.save')}
            </Button>
          </>
        ) : (
          <>
            <Button
              color="error"
              onClick={handleDeleteEvent}
              disabled={loading}
              variant="outlined"
              sx={{ mr: 'auto' }}
            >
              {t('common:buttons.delete')}
            </Button>
            <Button variant="outlined" onClick={handleStartEditing}>
              {t('common:buttons.edit')}
            </Button>
          </>
        )
      }
    >
      {isEditing ? (
        <EventForm
          currentEvent={internalEvent}
          setEvent={handleUpdateInternal}
          employees={employees}
          constructions={constructions}
          validationError={validationError}
          loading={!!loading}
        />
      ) : (
        <EventDetails
          event={internalEvent}
          employees={employees}
          constructions={constructions}
        />
      )}
    </BaseDialog>
  );
};
