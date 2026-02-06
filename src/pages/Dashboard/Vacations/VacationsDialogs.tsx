import React, { useMemo, useState, useRef, useEffect } from 'react';
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
  Tooltip,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import BaseDialog from '../../../shared/ui/BaseDialog';
import {
  employeeColors,
  getDateStr,
  stringToColor,
  type CalendarDay,
  type CalendarEvent,
} from './VacationsHelpers';
import type { Employee, Vacation } from '../../../shared/model/types';
import {
  Add,
  CalendarMonth,
  Close as CloseIcon,
  Person,
  Print as PrintIcon,
} from '@mui/icons-material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs, { Dayjs } from 'dayjs';
import { useReactToPrint } from 'react-to-print';
import { plPL } from '@mui/x-date-pickers/locales';

interface FilterDialogProps {
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  employees: Employee[];
  selectedEmployees: string[];
  setSelectedEmployees: (employees: string[]) => void;
  showInactive: boolean;
  setShowInactive: (val: boolean) => void;
}

export const FilterDialog: React.FC<FilterDialogProps> = ({
  isFilterOpen,
  setIsFilterOpen,
  employees,
  selectedEmployees,
  setSelectedEmployees,
  showInactive,
  setShowInactive,
}) => {
  const filteredEmployees = useMemo(() => {
    if (showInactive) {
      return employees;
    }
    return employees.filter((emp) => emp.status);
  }, [employees, showInactive]);

  const selectedEmployeeObjects = useMemo(() => {
    return employees.filter((e) => selectedEmployees.includes(e.id));
  }, [employees, selectedEmployees]);

  const handleSelectAll = () => {
    const allIds = filteredEmployees.map((e) => e.id);
    setSelectedEmployees(allIds);
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
    >
      <Typography variant="overline" sx={{ mb: 1, display: 'block' }}>
        {selectedEmployees.length > 0
          ? `Wybrano: ${selectedEmployees.length} z ${filteredEmployees.length}`
          : 'Wszyscy pracownicy'}
      </Typography>
      <FormControl sx={{ width: '100%', maxWidth: '100%' }}>
        <Autocomplete
          size="small"
          multiple
          options={filteredEmployees}
          disableCloseOnSelect
          getOptionLabel={(opt) => opt.name}
          value={selectedEmployeeObjects}
          onChange={(_, newValue) =>
            setSelectedEmployees(newValue.map((e) => e.id))
          }
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
        label={
          <Typography variant="caption">
            Uwzględnij nieaktywnych pracowników w filtrze
          </Typography>
        }
        sx={{ mt: 1 }}
      />
      <Stack direction="row" spacing={1} justifyContent={'flex-end'}>
        <Button onClick={handleSelectAll} disabled={isAllSelected}>
          Wszyscy
        </Button>
        <Button onClick={handleClear}>Wyczyść</Button>
      </Stack>
    </BaseDialog>
  );
};

interface VacationFormProps {
  currentEvent: CalendarEvent;
  setEvent: (updates: Partial<CalendarEvent>) => void;
  employees: Employee[];
  validationError: string;
  loading: boolean;
  isNew: boolean;
}

const VacationForm: React.FC<VacationFormProps> = ({
  currentEvent,
  setEvent,
  employees,
  validationError,
  loading,
  isNew,
}) => {
  const theme = useTheme();

  const generatedColor = currentEvent.employeeId
    ? stringToColor(currentEvent.employeeId)
    : theme.palette.background.paper;

  const selectedEmployee =
    employees.find((e) => e.id === currentEvent.employeeId) || null;

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      {isNew ? (
        <Autocomplete
          size="small"
          options={employees.filter((e) => e.status)}
          getOptionLabel={(opt) => opt?.name || ''}
          value={selectedEmployee}
          onChange={(_, newValue) => {
            if (newValue) {
              const newColor = stringToColor(newValue.id);

              setEvent({
                employeeId: newValue.id,
                employeeName: newValue.name,
                employeeActive: newValue.status,
                color: currentEvent.color || newColor,
              });
            } else {
              setEvent({
                employeeId: '',
                employeeName: '',
                employeeActive: false,
              });
            }
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
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
              error={!!validationError && !currentEvent.employeeId}
              helperText={
                validationError && !currentEvent.employeeId
                  ? validationError
                  : ''
              }
              disabled={loading}
            />
          )}
          disabled={loading}
        />
      ) : (
        <TextField
          size="small"
          label="Pracownik"
          value={currentEvent.employeeName ?? ''}
          fullWidth
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
          sx={(theme) => ({
            '& .MuiInputBase-root': {
              background: theme.palette.action.disabledBackground,
            },
          })}
        />
      )}

      <TextField
        label="Opis"
        multiline
        minRows={4}
        slotProps={{
          input: {
            spellCheck: false,
          },
        }}
        value={currentEvent.description || ''}
        onChange={(e) => setEvent({ description: e.target.value })}
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
            onChange={(date) => date && setEvent({ startDate: date })}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
              },
            }}
            disabled={loading}
          />
          <DatePicker
            label="Data zakończenia *"
            openTo="month"
            views={['year', 'month', 'day']}
            value={currentEvent.endDate || null}
            onChange={(date) => date && setEvent({ endDate: date })}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
              },
            }}
            minDate={currentEvent.startDate || undefined}
            disabled={loading}
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

        <Stack direction="row" gap={1} flexWrap="wrap" mt={1}>
          <Box
            key={'generated'}
            sx={{
              width: 35,
              height: 25,
              backgroundColor: generatedColor,
              cursor: 'pointer',
              borderRadius: 1,
              border:
                currentEvent.color === generatedColor || !currentEvent.color
                  ? `2px solid ${theme.palette.text.primary}`
                  : !currentEvent.employeeId
                    ? `1px solid ${theme.palette.divider}`
                    : '',
            }}
            onClick={() => setEvent({ color: generatedColor })}
          />
          {employeeColors.map((color) => (
            <Box
              key={color}
              sx={(theme) => ({
                width: 25,
                height: 25,
                backgroundColor: color,
                cursor: 'pointer',
                borderRadius: 1,
                border:
                  currentEvent.color === color
                    ? `2px solid ${theme.palette.text.primary}`
                    : '',
              })}
              onClick={() => setEvent({ color: color })}
            />
          ))}
        </Stack>
      </Box>

      {validationError && validationError.includes('urlop w dniach') && (
        <Alert severity="error">{validationError}</Alert>
      )}
    </Stack>
  );
};

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
    if (open) {
      setInternalEvent(currentEvent);
    }
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

interface VacationDetailsProps {
  event: CalendarEvent;
  onNavigateToEmployee: () => void;
}

const VacationDetails: React.FC<VacationDetailsProps> = ({
  event,
  onNavigateToEmployee,
}) => {
  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <Tooltip title="Przejdź do pracownika">
          <IconButton onClick={onNavigateToEmployee} sx={{ p: 0 }}>
            <Person color="action" fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography variant="subtitle2" color="text.secondary">
          {event.employeeName ?? ''}{' '}
          {event.employeeActive ? '' : '(nieaktywny)'}
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
          {getDateStr(event.startDate, event.endDate, true)}
        </Typography>
      </Stack>

      {event.description && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Opis
          </Typography>
          <Typography>{event.description || 'Brak opisu'}</Typography>
        </Box>
      )}

      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Kolor oznaczenia
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

export default VacationDetails;

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

  const handleUpdate = (updates: Partial<CalendarEvent>) => {
    setInternalEvent((prev) => ({ ...prev, ...updates }));
  };

  const handleStartEditing = () => {
    setInternalEvent(currentEvent);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setInternalEvent(currentEvent);
    setIsEditing(false);
    if (handleResetError) handleResetError();
  };

  const handleSave = () => {
    handleEditEvent(internalEvent);
  };

  const handleClickOnEmployee = () => {
    if (currentEvent.employeeId) {
      navigate(`/employees/${currentEvent.employeeId}`);
    }
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
            {isEditing ? 'Edytuj urlop' : 'Szczegóły urlopu'}
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
              Anuluj
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={loading}>
              Zapisz zmiany
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
              Usuń
            </Button>
            <Button
              variant="outlined"
              onClick={handleStartEditing}
              disabled={loading}
            >
              Edytuj
            </Button>
          </>
        )
      }
    >
      {isEditing ? (
        <VacationForm
          isNew={false}
          currentEvent={internalEvent}
          setEvent={handleUpdate}
          employees={employees}
          validationError={validationError}
          loading={loading}
        />
      ) : (
        <VacationDetails
          event={internalEvent}
          onNavigateToEmployee={handleClickOnEmployee}
        />
      )}
    </BaseDialog>
  );
};

interface EventListDialogProps {
  open: boolean;
  onClose: () => void;
  onEventClick: (event: CalendarEvent) => void;
  selectedDayData: CalendarDay | null;
  loading?: boolean;
  onAddButtonClick: (date?: Dayjs | undefined) => void;
}

export const EventListDialog: React.FC<EventListDialogProps> = ({
  onEventClick,
  open,
  onClose,
  selectedDayData,
  onAddButtonClick,
  loading,
}) => {
  const sortedEvents = useMemo(() => {
    if (!selectedDayData) return [];

    const events = selectedDayData?.events ?? [];

    return events.sort((a, b) => {
      const aIsStart = selectedDayData.date.isSame(a.startDate, 'day');
      const aIsEnd = selectedDayData.date.isSame(a.endDate, 'day');
      const bIsStart = selectedDayData.date.isSame(b.startDate, 'day');
      const bIsEnd = selectedDayData.date.isSame(b.endDate, 'day');

      if (aIsStart && !aIsEnd && !(bIsStart && !bIsEnd)) return -1;
      if (bIsStart && !bIsEnd && !(aIsStart && !aIsEnd)) return 1;

      if (!aIsStart && aIsEnd && !(!bIsStart && bIsEnd)) return -1;
      if (!bIsStart && bIsEnd && !(!aIsStart && aIsEnd)) return 1;

      if (!aIsStart && !aIsEnd && (bIsStart || bIsEnd)) return 1;
      if (!bIsStart && !bIsEnd && (aIsStart || aIsEnd)) return -1;

      return a.startDate.valueOf() - b.startDate.valueOf();
    });
  }, [selectedDayData]);

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={
        <Stack direction={'row'} alignItems={'center'} spacing={1}>
          <Typography variant="h6">
            Urlopy ({selectedDayData?.events.length})
          </Typography>
          <span>-</span>
          <Chip
            color="primary"
            label={selectedDayData?.date.format('DD.MM.YYYY')}
          />
        </Stack>
      }
      actions={
        <Button
          key="add"
          variant="contained"
          startIcon={<Add />}
          disabled={loading}
          onClick={() => onAddButtonClick(selectedDayData?.date)}
        >
          Dodaj
        </Button>
      }
      showConfirm={false}
      cancelText="Zamknij"
      maxWidth="md"
      contentSx={{
        p: 0,
      }}
    >
      <Stack direction="column" spacing={1}>
        <TableContainer
          component={Paper}
          className="rounded-none shadow-none"
          sx={{ maxHeight: 600, overflow: 'auto' }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Pracownik</TableCell>
                <TableCell>Okres urlopu</TableCell>
                <TableCell>Długość</TableCell>
                <TableCell>Kolor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedEvents.length > 0 && selectedDayData ? (
                sortedEvents.map((event) => {
                  const isStart = selectedDayData?.date.isSame(
                    event.startDate,
                    'day'
                  );
                  const isEnd = selectedDayData?.date.isSame(
                    event.endDate,
                    'day'
                  );
                  const duration =
                    event.endDate.diff(event.startDate, 'day') + 1;

                  return (
                    <TableRow
                      key={event.id}
                      hover
                      onClick={() => onEventClick(event)}
                      sx={{
                        cursor: 'pointer',
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="500"
                          noWrap
                          sx={{
                            textDecoration: event.employeeActive
                              ? 'none'
                              : 'line-through',
                          }}
                        >
                          {event.employeeName}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <PlayArrowIcon
                            sx={{
                              width: 15,
                              visibility: isStart ? 'visible' : 'hidden',
                            }}
                          />

                          <Typography variant="body2">
                            {getDateStr(event.startDate, event.endDate)}
                          </Typography>

                          <PlayArrowIcon
                            sx={{
                              width: 15,
                              transform: 'rotate(180deg)',
                              visibility: isEnd ? 'visible' : 'hidden',
                            }}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {duration} {duration < 2 ? 'dzień' : 'dni'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          sx={{
                            background: event.color,
                            minWidth: '50px',
                            borderRadius: 1,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell className="!py-3" colSpan={4}>
                    <Typography variant="body2" fontWeight="500" align="center">
                      Brak wpisów...
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </BaseDialog>
  );
};

interface VacationReportDialogProps {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
  vacations: Vacation[];
  showInactive: boolean;
  setShowInactive: (val: boolean) => void;
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
  showInactive,
  setShowInactive,
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
      const employeeVacations = vacations.filter((vacation) => {
        if (vacation.employeeId !== employee.id) return false;

        const vacationStart = dayjs(vacation.startDate).startOf('day');

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
  }, [selectedEmployees, effectiveDateRange, vacations]);

  // const [showInactive, setShowInactive] = useState<boolean>(false);

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

      <DialogContent dividers className="px-3 sm:px-5">
        <LocalizationProvider
          localeText={
            plPL.components.MuiLocalizationProvider.defaultProps.localeText
          }
          dateAdapter={AdapterDayjs}
          adapterLocale="pl"
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Pracownicy
              </Typography>
              <Typography variant="overline" sx={{ mb: 1.5, display: 'block' }}>
                {selectedEmployees.length < filteredEmployees.length
                  ? `Wybrano: ${selectedEmployees.length} z ${filteredEmployees.length}`
                  : 'Wszyscy pracownicy'}
              </Typography>
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

              <FormControlLabel
                sx={{ mt: 1 }}
                control={
                  <Checkbox
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="caption">
                    Uwzględnij nieaktywnych
                  </Typography>
                }
              />
              <Stack direction="row" spacing={1} justifyContent={'flex-end'}>
                <Button onClick={handleSelectAll} disabled={isAllSelected}>
                  Wszyscy
                </Button>

                <Button onClick={handleClear}>Wyczyść</Button>
              </Stack>
            </Box>

            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle2">Zakres dat</Typography>

                <Button onClick={handleClearAllDates}>Wyczyść daty</Button>
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
                          key={`${employee.id}-${vacation.id}-${index}`}
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
