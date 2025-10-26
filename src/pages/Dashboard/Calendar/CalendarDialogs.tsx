import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  TextField,
  Checkbox,
  Button,
  IconButton,
  Stack,
  Typography,
  Autocomplete,
  Chip,
  Alert,
  Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
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
  return (
    <Dialog
      open={isFilterOpen}
      onClose={() => setIsFilterOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ px: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent={'space-between'}
        >
          <Typography variant="h6" component="div">
            Filtr pracowników
          </Typography>
          <IconButton onClick={() => setIsFilterOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          px: 2,
        }}
      >
        <FormControl sx={{ width: '100%', maxWidth: '100%' }}>
          <Autocomplete
            size="small"
            multiple
            id="checkboxes-tags-demo"
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
            renderInput={(params) => (
              <TextField {...params} label="Pracownicy" />
            )}
          />
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 2 }}>
        <Button onClick={() => setSelectedEmployees([])}>Wyczyść</Button>
      </DialogActions>
    </Dialog>
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
}

export const AddEventDialog: React.FC<AddEventDialogProps> = ({
  activeDialog,
  currentEvent,
  validationError,
  employees,
  handleModalClose,
  handleEmployeeChange,
  handleAddEvent,
}) => {
  return (
    <Dialog
      open={activeDialog.type === 'addEvent'}
      onClose={handleModalClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ px: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Dodaj urlop
          </Typography>
          <IconButton onClick={handleModalClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ maxWidth: '100%', px: 2 }}>
        <Autocomplete
          size="small"
          options={employees.filter((e) => e.status)}
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
              label="Pracownicy"
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
          <Stack direction="row" alignItems="center" spacing={1} my={2}>
            <Chip
              label={currentEvent.startDate.format('DD.MM.YYYY')}
              color="primary"
              variant="outlined"
              sx={{ ml: 1, mr: 1 }}
            />
            <Typography>–</Typography>
            <Chip
              label={currentEvent.endDate.format('DD.MM.YYYY')}
              color="primary"
              variant="outlined"
              sx={{ ml: 1, mr: 1 }}
            />
          </Stack>
        )}

        {validationError && validationError.includes('urlop w dniach') && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {validationError}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2 }}>
        <Button variant="contained" onClick={() => handleAddEvent()}>
          Zapisz
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface EventDetailsDialogProps {
  activeDialog: ActiveDialog;
  currentEvent: CalendarEvent;
  selectedEmployees: Employee[];
  handleModalClose: () => void;
  handleDeleteEvent: (id?: string) => void;
}

export const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({
  activeDialog,
  currentEvent,
  selectedEmployees,
  handleModalClose,
  handleDeleteEvent,
}) => {
  return (
    <Dialog
      open={
        activeDialog.type === 'moreEvents' ||
        activeDialog.type === 'eventDetails'
      }
      onClose={handleModalClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ px: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {activeDialog.type === 'moreEvents'
              ? `Urlopy - ${activeDialog.day.date.format('DD.MM.YYYY')}`
              : 'Szczegóły urlopu'}
          </Typography>
          <IconButton onClick={handleModalClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ maxWidth: '100%', px: 2 }}>
        <Stack direction={'column'} spacing={1}>
          {activeDialog.type === 'moreEvents'
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
                      p: 1,
                      backgroundColor: getColorForEmployee(event.employee.id),
                      borderRadius: 1,
                      cursor: 'pointer',
                      ':hover': { opacity: 0.9 },
                      overflow: 'hidden',
                    }}
                    direction={'row'}
                    alignItems={'center'}
                    className={'border-darkGray border'}
                  >
                    <Box
                      sx={{
                        flexGrow: 1,
                        flexShrink: 1,
                        maxWidth: '100%',
                        overflow: 'hidden',
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        noWrap
                        sx={{
                          mb: 0.25,
                          fontWeight: 500,
                        }}
                      >
                        {event.employee?.name}
                      </Typography>
                      <Typography variant="body1">
                        {event.startDate.format('DD.MM.YYYY')} –{' '}
                        {event.endDate.format('DD.MM.YYYY')}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      className="text-gray-700/50"
                      onClick={() => handleDeleteEvent(event.groupId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                ))
            : currentEvent.employee && (
                <Box
                  sx={{
                    p: 1,
                    backgroundColor: getColorForEmployee(
                      currentEvent.employee.id
                    ),
                    borderRadius: 1,
                    cursor: 'pointer',
                    ':hover': { opacity: 0.9 },
                  }}
                  className={'border-darkGray border'}
                >
                  <Typography
                    variant="subtitle1"
                    noWrap
                    sx={{
                      mb: 0.25,
                      fontWeight: 500,
                    }}
                  >
                    {currentEvent.employee?.name}
                  </Typography>
                  <Typography variant="body1">
                    {currentEvent.startDate.format('DD.MM.YYYY')} –{' '}
                    {currentEvent.endDate.format('DD.MM.YYYY')}
                  </Typography>
                </Box>
              )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2 }}>
        {activeDialog.type === 'eventDetails' && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleDeleteEvent()}
          >
            Usuń
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
