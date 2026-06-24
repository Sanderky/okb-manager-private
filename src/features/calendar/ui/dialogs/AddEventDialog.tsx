import React, { useEffect, useState } from 'react';
import { Typography, Stack } from '@mui/material';
import BaseDialog from '@/shared/ui/BaseDialog';
import { useEventColor } from '@/entities/events';
import type { Construction } from '@/entities/construction';
import type { Employee } from '@/entities/employee';
import type { UiCalendarEvent } from '../../model/types';
import { EventForm } from './components/EventForm';

interface AddEventDialogProps {
  open: boolean;
  currentEvent: Partial<UiCalendarEvent>;
  validationError: string;
  employees: Employee[];
  constructions: Construction[];
  handleModalClose: () => void;
  handleAddEvent: (eventData: Partial<UiCalendarEvent>) => void;
  loading?: boolean;
}

export const AddEventDialog: React.FC<AddEventDialogProps> = ({
  open,
  currentEvent,
  validationError,
  employees,
  constructions,
  handleModalClose,
  handleAddEvent,
  loading,
}) => {
  const [internalEvent, setInternalEvent] =
    useState<Partial<UiCalendarEvent>>(currentEvent);
  const { getEventColor, getEventTextColor } = useEventColor();

  useEffect(() => {
    if (open) setInternalEvent(currentEvent);
  }, [open, currentEvent]);

  const handleUpdate = (updates: Partial<UiCalendarEvent>) => {
    setInternalEvent((prev) => ({ ...prev, ...updates }));
  };

  return (
    <BaseDialog
      open={open}
      onClose={handleModalClose}
      onConfirm={() => handleAddEvent(internalEvent)}
      confirmText="Dodaj"
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
            Nowe wydarzenie
          </Typography>
        </Stack>
      }
      loading={loading}
      showCancel={false}
    >
      <EventForm
        currentEvent={internalEvent}
        setEvent={handleUpdate}
        employees={employees}
        constructions={constructions}
        validationError={validationError}
        loading={!!loading}
      />
    </BaseDialog>
  );
};
