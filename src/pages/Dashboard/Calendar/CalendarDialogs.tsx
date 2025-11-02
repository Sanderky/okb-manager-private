import React, { useMemo, useState, useRef } from 'react';
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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import BaseDialog from '../../../components/BaseDialog';
import {
  getColorForEmployee,
  type ActiveDialog,
  type CalendarEvent,
} from './CalendarHelpers';
import type { Employee, Vacation } from '../../../types';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Close as CloseIcon,
  Clear as ClearIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { useReactToPrint } from 'react-to-print';

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
      showCancel={false}
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

// Komponent do drukowania
const PrintableVacationReport: React.FC<{
  report: VacationReportItem[];
  dateRange: { start: Dayjs | null; end: Dayjs | null };
  selectedEmployeesCount: number;
}> = ({ report, dateRange, selectedEmployeesCount }) => {
  const effectiveDateRange = useMemo(() => {
    const start =
      dateRange.start || dayjs().subtract(1, 'month').startOf('day');
    const end = dateRange.end || dayjs().endOf('day');
    return { start, end };
  }, [dateRange.start, dateRange.end]);

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
          <strong>Liczba pracowników:</strong> {selectedEmployeesCount}
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
              <TableCell>{employee.name}</TableCell>
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

  // Grupowanie urlopów - pobieramy tylko unikalne groupId
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

  // Obliczanie rzeczywistego zakresu dat z domyślnymi wartościami
  const effectiveDateRange = useMemo(() => {
    const start =
      dateRange.start || dayjs().subtract(1, 'month').startOf('day');
    const end = dateRange.end || dayjs().endOf('day');
    return { start, end };
  }, [dateRange.start, dateRange.end]);

  // Generowanie raportu - teraz jako płaska lista z sortowaniem
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

        // Filtruj tylko urlopy, które ZACZYNAJĄ SIĘ w wybranym zakresie dat
        return vacationStart.isBetween(
          effectiveStart,
          effectiveEnd,
          'day',
          '[]'
        );
      });

      // Sortowanie urlopów pracownika po dacie rozpoczęcia
      const sortedVacations = employeeVacations.sort(
        (a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
      );

      // Dodaj do płaskiej listy
      sortedVacations.forEach((vacation) => {
        reportItems.push({
          employee,
          vacation,
        });
      });
    });

    // Sortowanie całej listy po dacie rozpoczęcia urlopu
    return reportItems.sort(
      (a, b) =>
        dayjs(a.vacation.startDate).valueOf() -
        dayjs(b.vacation.startDate).valueOf()
    );
  }, [selectedEmployees, effectiveDateRange, uniqueVacations]);

  const handleSelectAll = () => {
    setSelectedEmployees([...employees]);
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
    selectedEmployees.length === employees.length && employees.length > 0;
  const hasDateError =
    dateRange.start && dateRange.end && dateRange.start.isAfter(dateRange.end);

  // const { start: effectiveStart, end: effectiveEnd } = effectiveDateRange;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
          <Stack spacing={3}>
            {/* Sekcja wyboru pracowników */}
            <Box>
              <FormLabel className="mb-2 block">Pracownicy</FormLabel>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
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
              </Stack>
              <Autocomplete
                multiple
                options={employees}
                getOptionLabel={(opt) => opt.name}
                value={selectedEmployees}
                onChange={(_, newValue) => setSelectedEmployees(newValue)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox checked={selected} />
                    {option.name}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Wybierz pracowników..."
                    size="small"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Wybrano: {selectedEmployees.length} z {employees.length}
              </Typography>
            </Box>

            {/* Sekcja zakresu dat */}
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
                <Box sx={{ position: 'relative', flex: 1 }}>
                  <DatePicker
                    label="Data od (opcjonalnie)"
                    value={dateRange.start}
                    onChange={(newValue) =>
                      setDateRange((prev) => ({ ...prev, start: newValue }))
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small' as const,
                        error: hasDateError || undefined,
                      },
                      actionBar: {
                        actions: ['clear'],
                      },
                    }}
                    maxDate={dateRange.end!}
                  />
                  {dateRange.start && (
                    <IconButton
                      size="small"
                      onClick={handleClearStartDate}
                      sx={{
                        position: 'absolute',
                        right: 40,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1,
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Box sx={{ position: 'relative', flex: 1 }}>
                  <DatePicker
                    label="Data do (opcjonalnie)"
                    value={dateRange.end}
                    onChange={(newValue) =>
                      setDateRange((prev) => ({ ...prev, end: newValue }))
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small' as const,
                        error: hasDateError || undefined,
                      },
                      actionBar: {
                        actions: ['clear'],
                      },
                    }}
                    minDate={dateRange.start!}
                  />
                  {dateRange.end && (
                    <IconButton
                      size="small"
                      onClick={handleClearEndDate}
                      sx={{
                        position: 'absolute',
                        right: 40,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1,
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Stack>
              {hasDateError && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  Data początkowa nie może być późniejsza niż data końcowa
                </Typography>
              )}
            </Box>

            {/* Wygenerowany raport */}
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
                        >
                          <TableCell>{employee.name}</TableCell>
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

      {/* Ukryty komponent do drukowania */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <PrintableVacationReport
            report={generatedReport}
            dateRange={dateRange}
            selectedEmployeesCount={selectedEmployees.length}
          />
        </div>
      </div>
    </Dialog>
  );
};
