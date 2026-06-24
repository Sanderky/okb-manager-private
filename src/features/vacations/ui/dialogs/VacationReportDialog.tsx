import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControlLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Close as CloseIcon, Print as PrintIcon } from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { useReactToPrint } from 'react-to-print';
import { plPL } from '@mui/x-date-pickers/locales';
import type { Employee } from '@/entities/employee';
import { type Vacation } from '@/entities/vacations';

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
