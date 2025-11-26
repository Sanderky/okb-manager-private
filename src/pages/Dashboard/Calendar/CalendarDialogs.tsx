import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControlLabel,
  darken,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import BaseDialog from '../../../components/BaseDialog';
import {
  employeeColors,
  type ActiveDialog,
  type CalendarEvent,
} from './CalendarHelpers';
import type { Employee, Vacation } from '../../../types';
import DeleteIcon from '@mui/icons-material/Delete';
import { Close as CloseIcon, Print as PrintIcon } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import dayjs, { Dayjs } from 'dayjs';
import { useReactToPrint } from 'react-to-print';
import { plPL } from '@mui/x-date-pickers/locales';

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
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const filteredEmployees = useMemo(() => {
    if (showInactive) {
      return employees;
    }
    return employees.filter((emp) => emp.status);
  }, [employees, showInactive]);

  const handleSelectAll = () => {
    setSelectedEmployees([...filteredEmployees]);
  };

  const handleClear = () => {
    setSelectedEmployees([]);
  };

  const isAllSelected =
    selectedEmployees.length === filteredEmployees.length &&
    filteredEmployees.length > 0;

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
        {`Wybrane: ${selectedEmployees.length} z ${filteredEmployees.length}`}
      </Typography>
      <FormControl sx={{ width: '100%', maxWidth: '100%' }}>
        <Autocomplete
          size="small"
          multiple
          options={filteredEmployees}
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
                {!option.status && (
                  <Chip
                    label="Nieaktywny"
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </li>
            );
          }}
          renderInput={(params) => <TextField {...params} label="Pracownicy" />}
        />
      </FormControl>
      <FormControlLabel
        control={
          <Checkbox
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            size="small"
          />
        }
        label="Uwzględnij nieaktywnych"
        className="mt-2"
      />
    </BaseDialog>
  );
};

interface AddEventDialogProps {
  activeDialog: ActiveDialog;
  currentEvent: CalendarEvent;
  setCurrentEvent: (event: CalendarEvent) => void;
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
  setCurrentEvent,
  validationError,
  employees,
  handleModalClose,
  handleEmployeeChange,
  handleAddEvent,
  loading = false,
}) => {
  const handleDescriptionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCurrentEvent({
      ...currentEvent,
      description: event.target.value,
    });
  };

  const handleColorChange = (color: string) => {
    setCurrentEvent({
      ...currentEvent,
      color: color,
    });
  };

  const handleStartDateChange = (date: Dayjs | null) => {
    if (date) {
      setCurrentEvent({
        ...currentEvent,
        startDate: date,
      });
    }
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    if (date) {
      setCurrentEvent({
        ...currentEvent,
        endDate: date,
      });
    }
  };

  const isFormValid = currentEvent.employee && currentEvent.color;

  return (
    <BaseDialog
      open={activeDialog.type === 'addEvent'}
      onClose={handleModalClose}
      onConfirm={handleAddEvent}
      title="Dodaj urlop"
      confirmText="Zapisz urlop"
      loading={loading}
      disabled={!isFormValid}
      showCancel={false}
    >
      <Stack spacing={2}>
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
              label="Pracownik *"
              error={!!validationError && !currentEvent.employee?.id}
              helperText={
                validationError && !currentEvent.employee?.id
                  ? validationError
                  : ''
              }
              disabled={loading}
            />
          )}
          disabled={loading}
        />

        <TextField
          label="Opis"
          multiline
          rows={4}
          value={currentEvent.description || ''}
          onChange={handleDescriptionChange}
          disabled={loading}
        />

        <LocalizationProvider
          localeText={
            plPL.components.MuiLocalizationProvider.defaultProps.localeText
          }
          dateAdapter={AdapterDayjs}
          adapterLocale="pl"
        >
          <Stack direction="row" spacing={{ xs: 1, sm: 2 }}>
            <DatePicker
              label="Data rozpoczęcia *"
              openTo="month"
              views={['year', 'month', 'day']}
              value={currentEvent.startDate || null}
              onChange={handleStartDateChange}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />
            <DatePicker
              label="Data zakończenia *"
              openTo="month"
              views={['year', 'month', 'day']}
              value={currentEvent.endDate || null}
              onChange={handleEndDateChange}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
              minDate={currentEvent.startDate || null}
            />
          </Stack>
        </LocalizationProvider>

        <Box>
          <FormLabel>Wybierz kolor *</FormLabel>
          {!currentEvent.color && validationError && (
            <Typography
              variant="caption"
              color="error"
              sx={{ display: 'block', mt: 0.5 }}
            >
              {validationError}
            </Typography>
          )}
          <Stack direction="row" gap={1} sx={{ mt: 1 }} flexWrap="wrap">
            {employeeColors.map((color) => (
              <Box
                key={color}
                sx={{
                  width: 25,
                  height: 25,
                  backgroundColor: color,
                  cursor: 'pointer',
                  borderRadius: 1,
                  border: currentEvent.color === color ? '2px solid #000' : '',
                }}
                onClick={() => handleColorChange(color)}
              />
            ))}
          </Stack>
        </Box>

        {validationError && validationError.includes('urlop w dniach') && (
          <Alert severity="error">{validationError}</Alert>
        )}
      </Stack>
    </BaseDialog>
  );
};

interface EditEventDialogProps {
  activeDialog: ActiveDialog;
  currentEvent: CalendarEvent;
  setCurrentEvent: (event: CalendarEvent) => void;
  validationError: string;
  employees: Employee[];
  handleModalClose: () => void;
  handleEmployeeChange: (employee: Employee) => void;
  handleEditEvent: () => void;
  loading?: boolean;
}

export const EditEventDialog: React.FC<EditEventDialogProps> = ({
  activeDialog,
  currentEvent,
  setCurrentEvent,
  validationError,
  employees,
  handleModalClose,
  handleEmployeeChange,
  handleEditEvent,
  loading = false,
}) => {
  const handleDescriptionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCurrentEvent({
      ...currentEvent,
      description: event.target.value,
    });
  };

  const handleColorChange = (color: string) => {
    setCurrentEvent({
      ...currentEvent,
      color: color,
    });
  };

  const handleStartDateChange = (date: Dayjs | null) => {
    if (date) {
      setCurrentEvent({
        ...currentEvent,
        startDate: date,
      });
    }
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    if (date) {
      setCurrentEvent({
        ...currentEvent,
        endDate: date,
      });
    }
  };

  const isFormValid = currentEvent.color;

  return (
    <BaseDialog
      open={activeDialog.type === 'editEvent'}
      onClose={handleModalClose}
      onConfirm={handleEditEvent}
      title="Edytuj urlop"
      confirmText="Zapisz zmiany"
      loading={loading}
      disabled={!isFormValid}
      showCancel={false}
    >
      <Stack spacing={2}>
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
            <TextField {...params} label="Pracownik" disabled />
          )}
          disabled={true}
        />

        <TextField
          label="Opis"
          multiline
          rows={4}
          value={currentEvent.description || ''}
          onChange={handleDescriptionChange}
          disabled={loading}
        />

        <LocalizationProvider
          localeText={
            plPL.components.MuiLocalizationProvider.defaultProps.localeText
          }
          dateAdapter={AdapterDayjs}
          adapterLocale="pl"
        >
          <Stack direction="row" spacing={{ xs: 1, sm: 2 }}>
            <DatePicker
              label="Data rozpoczęcia *"
              openTo="month"
              views={['year', 'month', 'day']}
              value={currentEvent.startDate || null}
              onChange={handleStartDateChange}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />
            <DatePicker
              label="Data zakończenia *"
              value={currentEvent.endDate || null}
              openTo="month"
              views={['year', 'month', 'day']}
              onChange={handleEndDateChange}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
              minDate={currentEvent.startDate || null}
            />
          </Stack>
        </LocalizationProvider>

        <Box>
          <FormLabel>Wybierz kolor *</FormLabel>
          {!currentEvent.color && validationError && (
            <Typography
              variant="caption"
              color="error"
              sx={{ display: 'block', mt: 0.5 }}
            >
              {validationError}
            </Typography>
          )}
          <Stack
            direction="row"
            // spacing={1}
            gap={1}
            sx={{ mt: 1 }}
            flexWrap="wrap"
          >
            {employeeColors.map((color) => (
              <Box
                key={color}
                sx={{
                  width: 25,
                  height: 25,
                  backgroundColor: color,
                  cursor: 'pointer',
                  borderRadius: 1,
                  border: currentEvent.color === color ? '2px solid #000' : '',
                }}
                onClick={() => handleColorChange(color)}
              />
            ))}
          </Stack>
        </Box>

        {validationError && <Alert severity="error">{validationError}</Alert>}
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
  setActiveDialog: (dialog: ActiveDialog) => void;
  loading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
}

export const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({
  activeDialog,
  currentEvent,
  selectedEmployees,
  handleModalClose,
  handleDeleteEvent,
  setActiveDialog,
  loading = false,
  onEventClick,
}) => {
  const navigate = useNavigate();
  const isMultipleEvents = activeDialog.type === 'moreEvents';
  const isEventDetails = activeDialog.type === 'eventDetails';

  const handleDelete = () => {
    handleDeleteEvent();
  };

  const handleEdit = () => {
    setActiveDialog({ type: 'editEvent' });
  };

  const handleEmployeeProfileClick = (employeeId: string) => {
    navigate(`/employees/${employeeId}`);
  };

  const handleMoreEventsItemClick = (event: CalendarEvent) => {
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const theme = useTheme();

  return (
    <BaseDialog
      open={isMultipleEvents || isEventDetails}
      onClose={handleModalClose}
      title={
        isMultipleEvents ? (
          <Stack direction={'row'} alignItems={'center'} spacing={1}>
            <Typography variant="h6">
              Urlopy ({activeDialog.day.events.length})
            </Typography>
            <span>-</span>
            <Chip
              color="primary"
              label={activeDialog.day.date.format('DD.MM.YYYY')}
            />
          </Stack>
        ) : (
          'Szczegóły urlopu'
        )
      }
      showConfirm={false}
      showCancel={!isMultipleEvents}
      cancelText="Zamknij"
      actions={
        !isMultipleEvents ? (
          <>
            <Button
              variant="outlined"
              onClick={handleEdit}
              startIcon={<EditIcon />}
            >
              Edytuj
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDelete}
              loading={loading}
              startIcon={<DeleteIcon />}
            >
              Usuń urlop
            </Button>
          </>
        ) : undefined
      }
    >
      <Stack direction="column" spacing={1}>
        {isMultipleEvents
          ? activeDialog.day.events.map((event) => {
              const isStart = activeDialog.day.date.isSame(
                event.startDate,
                'day'
              );
              const isEnd = activeDialog.day.date.isSame(event.endDate, 'day');

              return (
                <Stack
                  key={event.id}
                  sx={{
                    backgroundColor: event.color,
                    borderRadius: 1,
                    cursor: 'pointer',
                    ':hover': { opacity: 0.9 },
                    overflow: 'hidden',
                    borderWidth: '1px',
                    borderColor: darken(event.color, 0.3),
                  }}
                  spacing={1}
                  direction="row"
                  alignItems="center"
                  className="px-3 py-2"
                  onClick={() => handleMoreEventsItemClick(event)}
                >
                  <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="500"
                      sx={{
                        whiteSpace: 'wrap',
                        // color: darken(event.color, 0.85),
                      }}
                    >
                      {event.employee?.name}{' '}
                      <Typography
                        component={'span'}
                        // color="error"
                        className="ml-1"
                        sx={{
                          color:
                            theme.palette.getContrastText(event.color) ===
                            '#fff'
                              ? '#fff'
                              : theme.palette.error.main,
                        }}
                      >
                        {!event.employee?.status && '(nieaktywny)'}
                      </Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {event.startDate.format('DD.MM.YYYY')} –{' '}
                      {event.endDate.format('DD.MM.YYYY')}
                    </Typography>
                    {event.description && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {event.description}
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      height: 3,
                      minWidth: '30px',
                      backgroundColor: darken(event.color, 0.5),
                      position: 'relative',
                      display: isStart || isEnd ? 'block' : 'none',
                      '&:after': {
                        content: "''",
                        height: 10,
                        width: 10,
                        backgroundColor: 'inherit',
                        position: 'absolute',
                        left: isStart ? 0 : 'unset',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: isStart ? 'block' : 'none',
                        borderRadius: '50%',
                      },
                      '&:before': {
                        content: "''",
                        height: 10,
                        width: 10,
                        backgroundColor: 'inherit',
                        position: 'absolute',
                        right: isEnd ? 0 : 'unset',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: isEnd ? 'block' : 'none',
                        borderRadius: '50%',
                      },
                    }}
                  />
                </Stack>
              );
            })
          : currentEvent.employee && (
              <Box className="border-lightGray rounded-lg border p-3">
                <Stack
                  direction={'row'}
                  justifyContent={'space-between'}
                  alignItems={'flex-start'}
                  spacing={1}
                  className="mb-3"
                >
                  <Box
                    sx={{
                      flexGrow: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <Typography
                      variant="body1"
                      fontWeight="600"
                      onClick={() =>
                        handleEmployeeProfileClick(currentEvent.employee.id)
                      }
                      sx={{
                        // overflow: 'hidden',
                        // textOverflow: 'ellipsis',
                        whiteSpace: 'wrap',
                        cursor: 'pointer',
                        ':hover': {
                          opacity: 0.8,
                          textDecoration: 'underline',
                        },
                        transition: '0.3s',
                      }}
                    >
                      {currentEvent.employee?.name}
                    </Typography>
                    <Typography variant="overline" className="text-gray-500">
                      Pracownik
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      fontSize: '0.7rem',
                    }}
                    className={`${currentEvent.employee?.status ? 'bg-green-600' : 'bg-red-400'} rounded-lg font-semibold text-white uppercase`}
                  >
                    {currentEvent.employee?.status ? 'Aktywny' : 'Nieaktywny'}
                  </Box>
                </Stack>

                {currentEvent.description && (
                  <Box className="border-lightGray mb-2 rounded-lg border bg-gray-50 p-2">
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight="500"
                      sx={{ display: 'block', mb: 0.5 }}
                    >
                      Opis
                    </Typography>
                    <Typography variant="body2">
                      {currentEvent.description}
                    </Typography>
                  </Box>
                )}

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1, sm: 2 }}
                >
                  <Box
                    className="border-lightGray rounded-lg border bg-gray-50 p-2"
                    sx={{
                      flex: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight="500"
                      sx={{ display: 'block', mb: 0.5 }}
                    >
                      Okres urlopu
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {currentEvent.startDate.format('DD.MM.YYYY')} –{' '}
                      {currentEvent.endDate.format('DD.MM.YYYY')}
                    </Typography>
                  </Box>
                  <Box
                    className="border-lightGray rounded-lg border bg-gray-50 p-2"
                    sx={{
                      flex: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight="500"
                      sx={{ display: 'block', mb: 0.5 }}
                    >
                      Długość urlopu
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {currentEvent.endDate.diff(
                        currentEvent.startDate,
                        'day'
                      ) + 1}{' '}
                      dni
                    </Typography>
                  </Box>
                </Stack>

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mt: 2 }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight="500"
                  >
                    Kolor:
                  </Typography>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: currentEvent.color,
                      borderRadius: 1,
                      border: '1px solid #ddd',
                    }}
                  />
                </Stack>
              </Box>
            )}
      </Stack>
    </BaseDialog>
  );
};

interface VacationReportDialogProps {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
  vacations: Vacation[];
}

interface VacationReportItem {
  employee: Employee;
  vacation: Vacation;
}

const PrintableVacationReport: React.FC<{
  report: VacationReportItem[];
  dateRange: { start: Dayjs | null; end: Dayjs | null };
}> = ({ report, dateRange }) => {
  const effectiveDateRange = useMemo(() => {
    const start =
      dateRange.start || dayjs().subtract(1, 'month').startOf('day');
    const end = dateRange.end || start.add(1, 'month').endOf('day');
    return { start, end };
  }, [dateRange.start, dateRange.end]);

  const uniqueEmployeesCount = useMemo(() => {
    const uniqueEmployeeIds = new Set(report.map((item) => item.employee.id));
    return uniqueEmployeeIds.size;
  }, [report]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom align="center">
        Wykaz urlopów
      </Typography>

      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Zakres dat:</strong>{' '}
          {effectiveDateRange.start.format('DD.MM.YYYY')} -{' '}
          {effectiveDateRange.end.format('DD.MM.YYYY')}
        </Typography>
        <Typography variant="body2">
          <strong>Liczba pracowników:</strong> {uniqueEmployeesCount}
        </Typography>
        <Typography variant="body2">
          <strong>Wygenerowano:</strong> {dayjs().format('DD.MM.YYYY HH:mm')}
        </Typography>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>
              <strong>Pracownik</strong>
            </TableCell>
            <TableCell>
              <strong>Data rozpoczęcia</strong>
            </TableCell>
            <TableCell>
              <strong>Data zakończenia</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Liczba dni</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {report.map(({ employee, vacation }, index) => (
            <TableRow key={`${employee.id}-${vacation.groupId}-${index}`}>
              <TableCell>
                {employee.name}
                {!employee.status && (
                  <Typography
                    component={'span'}
                    variant="inherit"
                    className="ml-1"
                    color="error"
                  >
                    (Nieaktywny)
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                {dayjs(vacation.startDate).format('DD.MM.YYYY')}
              </TableCell>
              <TableCell>
                {dayjs(vacation.endDate).format('DD.MM.YYYY')}
              </TableCell>
              <TableCell align="center">
                {dayjs(vacation.endDate).diff(
                  dayjs(vacation.startDate),
                  'day'
                ) + 1}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Typography variant="body2" sx={{ mt: 2, textAlign: 'right' }}>
        Łączna liczba urlopów: {report.length}
      </Typography>
    </Box>
  );
};

export const VacationReportDialog: React.FC<VacationReportDialogProps> = ({
  open,
  onClose,
  employees,
  vacations,
}) => {
  const navigate = useNavigate();
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [dateRange, setDateRange] = useState<{
    start: Dayjs | null;
    end: Dayjs | null;
  }>({
    start: null,
    end: null,
  });

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `wykaz_urlopow_${dayjs().format('YYYY-MM-DD')}`,
    pageStyle: `
      @page {
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
      }
    `,
  });

  const handleEmployeeProfileClick = (employeeId: string) => {
    navigate(`/employees/${employeeId}`);
  };

  const uniqueVacations = useMemo(() => {
    const grouped = vacations.reduce(
      (acc, vacation) => {
        if (!acc[vacation.groupId]) {
          acc[vacation.groupId] = vacation;
        }
        return acc;
      },
      {} as Record<string, Vacation>
    );

    return Object.values(grouped);
  }, [vacations]);

  const effectiveDateRange = useMemo(() => {
    const start =
      dateRange.start || dayjs().subtract(1, 'month').startOf('day');
    const end = dateRange.end || start.add(1, 'month').endOf('day');
    return { start, end };
  }, [dateRange.start, dateRange.end]);

  const generatedReport = useMemo((): VacationReportItem[] => {
    if (selectedEmployees.length === 0) {
      return [];
    }

    const { start: effectiveStart, end: effectiveEnd } = effectiveDateRange;

    const reportItems: VacationReportItem[] = [];

    selectedEmployees.forEach((employee) => {
      const employeeVacations = uniqueVacations.filter((vacation) => {
        if (vacation.employeeId !== employee.id) return false;

        const vacationStart = dayjs(vacation.startDate).startOf('day');
        // const vacationEnd = dayjs(vacation.endDate).endOf('day');

        return vacationStart.isBetween(
          effectiveStart,
          effectiveEnd,
          'day',
          '[]'
        );
      });

      const sortedVacations = employeeVacations.sort(
        (a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
      );

      sortedVacations.forEach((vacation) => {
        reportItems.push({
          employee,
          vacation,
        });
      });
    });

    return reportItems.sort(
      (a, b) =>
        dayjs(a.vacation.startDate).valueOf() -
        dayjs(b.vacation.startDate).valueOf()
    );
  }, [selectedEmployees, effectiveDateRange, uniqueVacations]);

  const [showInactive, setShowInactive] = useState<boolean>(false);

  const filteredEmployees = useMemo(() => {
    if (showInactive) {
      return employees;
    }
    return employees.filter((emp) => emp.status);
  }, [employees, showInactive]);

  const handleSelectAll = () => {
    setSelectedEmployees([...filteredEmployees]);
  };

  const handleClear = () => {
    setSelectedEmployees([]);
  };

  const handleClearStartDate = () => {
    setDateRange((prev) => ({ ...prev, start: null }));
  };

  const handleClearEndDate = () => {
    setDateRange((prev) => ({ ...prev, end: null }));
  };

  const handleClearAllDates = () => {
    setDateRange({
      start: null,
      end: null,
    });
  };

  const isAllSelected =
    selectedEmployees.length === filteredEmployees.length &&
    filteredEmployees.length > 0;
  const hasDateError =
    dateRange.start && dateRange.end && dateRange.start.isAfter(dateRange.end);

  // const { start: effectiveStart, end: effectiveEnd } = effectiveDateRange;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            width: '95%',
            m: 0,
          },
        },
      }}
    >
      <DialogTitle>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">Generuj wykaz urlopów</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <LocalizationProvider
          localeText={
            plPL.components.MuiLocalizationProvider.defaultProps.localeText
          }
          dateAdapter={AdapterDayjs}
          adapterLocale="pl"
        >
          <Stack spacing={3}>
            <Box>
              <FormLabel className="mb-2 block">Pracownicy</FormLabel>
              <Stack
                direction="row"
                alignItems={'center'}
                spacing={1}
                sx={{ mb: 1 }}
              >
                <Button
                  size="small"
                  onClick={handleSelectAll}
                  disabled={isAllSelected}
                >
                  Wybierz wszystkich
                </Button>
                <Button size="small" onClick={handleClear}>
                  Wyczyść
                </Button>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showInactive}
                      onChange={(e) => setShowInactive(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Uwzględnij nieaktywnych"
                />
              </Stack>
              <Autocomplete
                multiple
                options={filteredEmployees}
                getOptionLabel={(opt) => opt.name}
                value={selectedEmployees}
                onChange={(_, newValue) => setSelectedEmployees(newValue)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option, { selected }) => (
                  <li {...props} key={option.id}>
                    <Checkbox checked={selected} />
                    {option.name}
                    {!option.status && (
                      <Chip
                        label="Nieaktywny"
                        size="small"
                        color="default"
                        variant="outlined"
                        sx={{ ml: 1, height: 20 }}
                      />
                    )}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Wybierz pracowników..."
                    size="small"
                  />
                )}
                renderValue={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...chipProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option.name}
                        size="small"
                        {...chipProps}
                      />
                    );
                  })
                }
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Wybrano: {selectedEmployees.length} z {filteredEmployees.length}
              </Typography>
            </Box>

            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <FormLabel className="mb-2 block">Zakres dat</FormLabel>
                <Button size="small" onClick={handleClearAllDates}>
                  Wyczyść daty
                </Button>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <DatePicker
                  label="Data od (opcjonalnie)"
                  value={dateRange.start || null}
                  openTo="month"
                  views={['year', 'month', 'day']}
                  onChange={(newValue) =>
                    setDateRange((prev) => ({ ...prev, start: newValue }))
                  }
                  slotProps={{
                    field: {
                      clearable: true,
                      onClear: handleClearStartDate,
                    },
                    textField: {
                      fullWidth: true,
                      size: 'small' as const,
                      error: hasDateError || undefined,
                    },
                  }}
                  maxDate={dateRange.end || undefined}
                />
                <DatePicker
                  label="Data do (opcjonalnie)"
                  openTo="month"
                  views={['year', 'month', 'day']}
                  value={dateRange.end || null}
                  onChange={(newValue) =>
                    setDateRange((prev) => ({ ...prev, end: newValue }))
                  }
                  slotProps={{
                    field: {
                      clearable: true,
                      onClear: handleClearEndDate,
                    },
                    textField: {
                      fullWidth: true,
                      size: 'small' as const,
                      error: hasDateError || undefined,
                    },
                  }}
                  minDate={dateRange.start || undefined}
                />
              </Stack>
              <Typography variant="caption" className="text-gray-500">
                {'Efektywny zakres dat: '}
                {effectiveDateRange.start.format('DD.MM.YYYY')}
                {' - '}
                {effectiveDateRange.end.format('DD.MM.YYYY')}
              </Typography>
              {hasDateError && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  Data początkowa nie może być późniejsza niż data końcowa
                </Typography>
              )}
            </Box>

            {generatedReport.length > 0 && (
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6">
                    Wygenerowany wykaz urlopów ({generatedReport.length}{' '}
                    pozycji)
                  </Typography>
                </Stack>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Pracownik</TableCell>
                        <TableCell>Data rozpoczęcia</TableCell>
                        <TableCell>Data zakończenia</TableCell>
                        <TableCell align="center">Liczba dni</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {generatedReport.map(({ employee, vacation }, index) => (
                        <TableRow
                          key={`${employee.id}-${vacation.groupId}-${index}`}
                          sx={{ cursor: 'pointer' }}
                          onClick={() =>
                            handleEmployeeProfileClick(employee.id)
                          }
                        >
                          <TableCell>
                            {employee.name}
                            {!employee.status && (
                              <Typography
                                component={'span'}
                                variant="inherit"
                                className="ml-1"
                                color="error"
                              >
                                (Nieaktywny)
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {dayjs(vacation.startDate).format('DD.MM.YYYY')}
                          </TableCell>
                          <TableCell>
                            {dayjs(vacation.endDate).format('DD.MM.YYYY')}
                          </TableCell>
                          <TableCell align="center">
                            {dayjs(vacation.endDate).diff(
                              dayjs(vacation.startDate),
                              'day'
                            ) + 1}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {selectedEmployees.length > 0 && generatedReport.length === 0 && (
              <Alert severity="info">
                Brak urlopów w wybranym zakresie dla wybranych pracowników
              </Alert>
            )}
          </Stack>
        </LocalizationProvider>
      </DialogContent>

      <DialogActions>
        {generatedReport.length > 0 && (
          <Button
            variant="contained"
            onClick={handlePrint}
            startIcon={<PrintIcon />}
          >
            Drukuj
          </Button>
        )}
      </DialogActions>

      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <PrintableVacationReport
            report={generatedReport}
            dateRange={dateRange}
          />
        </div>
      </div>
    </Dialog>
  );
};
