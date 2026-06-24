import React, { useEffect, useState } from 'react';
import BaseDialog from '@/shared/ui/BaseDialog';
import type { Employee } from '@/entities/employee';
import type { CalendarEvent } from '../../model/types';
import { VacationForm } from './components/VacationForm';

interface AddVacationDialogProps {
  open: boolean;
  currentEvent: CalendarEvent;
  validationError: string;
  employees: Employee[];
  handleModalClose: () => void;
  handleAddEvent: (eventToSave: CalendarEvent) => void;
  loading?: boolean;
}

export const AddVacationDialog: React.FC<AddVacationDialogProps> = ({
  open,
  currentEvent,
  validationError,
  employees,
  handleModalClose,
  handleAddEvent,
  loading = false,
}) => {
  const [internalEvent, setInternalEvent] =
    useState<CalendarEvent>(currentEvent);

  useEffect(() => {
    if (open) setInternalEvent(currentEvent);
  }, [open, currentEvent]);

  const handleUpdate = (updates: Partial<CalendarEvent>) => {
    setInternalEvent((prev) => ({ ...prev, ...updates }));
  };

  const isFormValid = internalEvent.employeeId && internalEvent.color;

  return (
    <BaseDialog
      open={open}
      onClose={handleModalClose}
      onConfirm={() => handleAddEvent(internalEvent)}
      title="Dodaj urlop"
      confirmText="Zapisz urlop"
      loading={loading}
      disabled={!isFormValid}
      showCancel={false}
    >
      <VacationForm
        isNew={true}
        currentEvent={internalEvent}
        setEvent={handleUpdate}
        employees={employees}
        validationError={validationError}
        loading={loading}
      />
    </BaseDialog>
  );
};
