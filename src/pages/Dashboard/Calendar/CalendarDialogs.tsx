import React from 'react';
import {
  FormControl,
  TextField,
  Checkbox,
  Stack,
  Typography,
  Autocomplete,
  Chip,
  Alert,
  Box,
  IconButton,
  Button,
} from '@mui/material';
import BaseDialog from '../../../components/BaseDialog';
import {
  getColorForEmployee,
  type ActiveDialog,
  type CalendarEvent,
} from './CalendarHelpers';
import type { Employee } from '../../../types';
import DeleteIcon from '@mui/icons-material/Delete';

interface FilterDialogProps {
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  employees: Employee[];
  selectedEmployees: Employee[];
  setSelectedEmployees: (employees: Employee[]) => void;
}

export const FilterDialog: React.FC<FilterDialogProps> = ({
  isFilterOpen,
  setIsFilterOpen,
  employees,
  selectedEmployees,
  setSelectedEmployees,
}) => {
  const handleSelectAll = () => {
    setSelectedEmployees([...employees]);
  };

  const handleClear = () => {
    setSelectedEmployees([]);
  };

  const isAllSelected =
    selectedEmployees.length === employees.length && employees.length > 0;

  return (
    <BaseDialog
      open={isFilterOpen}
      onClose={() => setIsFilterOpen(false)}
      title="Filtr pracowników"
      showConfirm={false}
      actions={
        <Stack direction="row" spacing={1}>
          <Button onClick={handleSelectAll} disabled={isAllSelected}>
            Wszystko
          </Button>
          <Button onClick={handleClear}>Wyczyść</Button>
        </Stack>
      }
    >
      <Typography variant="overline" sx={{ mb: 1.5, display: 'block' }}>
        {`Wybrane: ${selectedEmployees.length} z ${employees.length}`}
      </Typography>
      <FormControl sx={{ width: '100%', maxWidth: '100%' }}>
        <Autocomplete
          size="small"
          multiple
          options={employees}
          disableCloseOnSelect
          getOptionLabel={(opt) => opt.name}
          value={selectedEmployees}
          onChange={(_, newValue) => setSelectedEmployees(newValue)}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          renderOption={(props, option, { selected }) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key} {...optionProps}>
                <Checkbox checked={selected} />
                {option.name}
              </li>
            );
          }}
          renderInput={(params) => <TextField {...params} label="Pracownicy" />}
        />
      </FormControl>
    </BaseDialog>
  );
};

interface AddEventDialogProps {
  activeDialog: ActiveDialog;
  currentEvent: CalendarEvent;
  validationError: string;
  employees: Employee[];
  handleModalClose: () => void;
  handleEmployeeChange: (employee: Employee) => void;
  handleAddEvent: () => void;
  loading?: boolean;
}

export const AddEventDialog: React.FC<AddEventDialogProps> = ({
  activeDialog,
  currentEvent,
  validationError,
  employees,
  handleModalClose,
  handleEmployeeChange,
  handleAddEvent,
  loading = false,
}) => {
  return (
    <BaseDialog
      open={activeDialog.type === 'addEvent'}
      onClose={handleModalClose}
      onConfirm={handleAddEvent}
      title="Dodaj urlop"
      confirmText="Zapisz urlop"
      loading={loading}
      disabled={!currentEvent.employee}
    >
      <Stack spacing={2}>
        <Autocomplete
          size="small"
          options={employees}
          getOptionLabel={(opt) => opt?.name}
          value={currentEvent.employee ?? null}
          onChange={(_, newValue) => handleEmployeeChange(newValue!)}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key} {...optionProps}>
                {option.name}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Pracownik"
              error={!!validationError && !currentEvent.employee?.id}
              helperText={
                validationError && !currentEvent.employee?.id
                  ? validationError
                  : ''
              }
            />
          )}
        />

        {currentEvent.startDate && currentEvent.endDate && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip
              label={currentEvent.startDate.format('DD.MM.YYYY')}
              color="primary"
              variant="outlined"
            />
            <Typography variant="body2">–</Typography>
            <Chip
              label={currentEvent.endDate.format('DD.MM.YYYY')}
              color="primary"
              variant="outlined"
            />
          </Stack>
        )}

        {validationError && validationError.includes('urlop w dniach') && (
          <Alert severity="error">{validationError}</Alert>
        )}
      </Stack>
    </BaseDialog>
  );
};

interface EventDetailsDialogProps {
  activeDialog: ActiveDialog;
  currentEvent: CalendarEvent;
  selectedEmployees: Employee[];
  handleModalClose: () => void;
  handleDeleteEvent: (id?: string) => void;
  loading?: boolean;
}

export const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({
  activeDialog,
  currentEvent,
  selectedEmployees,
  handleModalClose,
  handleDeleteEvent,
  loading = false,
}) => {
  const isMultipleEvents = activeDialog.type === 'moreEvents';

  const handleDelete = () => {
    handleDeleteEvent();
  };

  return (
    <BaseDialog
      open={isMultipleEvents || activeDialog.type === 'eventDetails'}
      onClose={handleModalClose}
      title={
        isMultipleEvents
          ? `Urlopy - ${activeDialog.day.date.format('DD.MM.YYYY')}`
          : 'Szczegóły urlopu'
      }
      showConfirm={false}
      showCancel={!isMultipleEvents}
      cancelText="Zamknij"
      actions={
        !isMultipleEvents ? (
          <Button
            variant="outlined"
            color="error"
            onClick={handleDelete}
            disabled={loading}
            startIcon={<DeleteIcon />}
          >
            Usuń urlop
          </Button>
        ) : undefined
      }
    >
      <Stack direction="column" spacing={1}>
        {isMultipleEvents
          ? activeDialog.day.events
              .filter(
                (e) =>
                  activeDialog.day.date.isBetween(
                    e.startDate,
                    e.endDate,
                    'day',
                    '[]'
                  ) &&
                  (selectedEmployees.length === 0 ||
                    selectedEmployees.some((emp) => emp.id === e.employee.id))
              )
              .map((event) => (
                <Stack
                  key={event.id}
                  sx={{
                    backgroundColor: getColorForEmployee(event.employee.id),
                    borderRadius: 1,
                    cursor: 'pointer',
                    ':hover': { opacity: 0.9 },
                    overflow: 'hidden',
                  }}
                  direction="row"
                  alignItems="center"
                  className="border border-gray-300 px-3 py-2"
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="500">
                      {event.employee?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {event.startDate.format('DD.MM.YYYY')} –{' '}
                      {event.endDate.format('DD.MM.YYYY')}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(event.groupId);
                    }}
                    disabled={loading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))
          : currentEvent.employee && (
              <Box
                sx={{
                  backgroundColor: getColorForEmployee(
                    currentEvent.employee.id
                  ),
                  borderRadius: 1,
                }}
                className="border border-gray-300 px-3 py-2"
              >
                <Typography variant="subtitle1" fontWeight="500">
                  {currentEvent.employee?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentEvent.startDate.format('DD.MM.YYYY')} –{' '}
                  {currentEvent.endDate.format('DD.MM.YYYY')}
                </Typography>
              </Box>
            )}
      </Stack>
    </BaseDialog>
  );
};
