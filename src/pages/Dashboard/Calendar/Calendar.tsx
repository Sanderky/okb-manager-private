import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  TextField,
  FormControl,
  Autocomplete,
  Grid,
  Dialog,
  FormGroup,
  DialogTitle,
  DialogContent,
  Chip,
  Alert,
  DialogActions,
  Tooltip,
  Link,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Close as CloseIcon,
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeeList, updateEmployee } from '../../../api/employees';
import type { Employee } from '../../../types';
import useNotifications from '../../../hooks/useNotifications/useNotifications';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.locale('pl');

interface CalendarEvent {
  id: string;
  employee: { id: string; name: string };
  startDate: Dayjs;
  endDate: Dayjs;
}

interface EventFormData {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  employee: Employee | null;
}

interface EventFormState {
  values: EventFormData;
  errors: Partial<Record<keyof EventFormData, string>>;
  isSubmitting: boolean;
}

// ---------------------
// Walidacja formularza
// ---------------------
const validate = (
  values: EventFormData
): Partial<Record<keyof EventFormData, string>> => {
  const errors: Partial<Record<keyof EventFormData, string>> = {};

  if (!values.employee?.id) errors.employee = 'Wybierz pracownika';

  if (values.employee?.vacation) {
    const conflict = values.employee.vacation.some((vac) => {
      const vacStart = dayjs(vac.startDate);
      const vacEnd = dayjs(vac.endDate);
      return (
        values.startDate!.isSameOrBefore(vacEnd, 'day') &&
        values.endDate!.isSameOrAfter(vacStart, 'day')
      );
    });
    if (conflict)
      errors.startDate = errors.endDate =
        'Pracownik ma już urlop w tym terminie';
  }

  return errors;
};

// ---------------------
// Komponent główny
// ---------------------
const Calendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(
    dayjs().startOf('month')
  );
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [startSelecting, setStartSelecting] = useState<Dayjs | null>(null);

  const notifications = useNotifications();
  const queryClient = useQueryClient();

  type ActiveDialog =
    | { type: 'none' }
    | { type: 'addEvent' }
    | { type: 'moreEvents'; day: Dayjs }
    | { type: 'deleteEvent'; event: CalendarEvent };

  const [activeDialog, setActiveDialog] = useState<ActiveDialog>({
    type: 'none',
  });

  const [formState, setFormState] = useState<EventFormState>({
    values: { employee: null, startDate: null, endDate: null },
    errors: {},
    isSubmitting: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) =>
      e.key === 'Escape' && setStartSelecting(null);
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: getEmployeeList,
  });

  // ---------------------
  // Mutacje
  // ---------------------
  const updateMutation = useMutation({
    mutationFn: (data: EventFormData) => {
      if (!data.employee) throw new Error('Brak ID pracownika');
      const newVacation = {
        id: crypto.randomUUID(),
        startDate: data.startDate!.toISOString(),
        endDate: data.endDate!.toISOString(),
      };
      const updatedVacations = [...(data.employee.vacation || []), newVacation];
      return updateEmployee(data.employee.id, { vacation: updatedVacations });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      notifications.show('Urlop został zapisany.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      handleModalClose();
    },
    onError: (error: Error) =>
      notifications.show(`Błąd zapisu: ${error.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (event: CalendarEvent) =>
      updateEmployee(event.employee.id, {
        vacation: (
          employees.find((e) => e.id === event.employee.id)?.vacation || []
        ).filter((vac) => vac.id !== event.id),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      notifications.show('Urlop został usunięty.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      handleModalClose();
    },
    onError: (error: Error) =>
      notifications.show(`Błąd usuwania: ${error.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      }),
  });

  // ---------------------
  // Generowanie wydarzeń
  // ---------------------
  const events = useMemo(
    () =>
      employees.flatMap((emp) =>
        (emp.vacation || []).map((vac) => ({
          id: vac.id,
          employee: { id: emp.id, name: emp.name },
          startDate: dayjs(vac.startDate),
          endDate: dayjs(vac.endDate),
        }))
      ),
    [employees]
  );

  const filteredEvents = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) =>
        a.startDate.diff(b.startDate, 'day') ||
        b.endDate.diff(b.startDate, 'day') - a.endDate.diff(b.startDate, 'day')
    );
    return selectedEmployee
      ? sorted.filter((e) => e.employee.id === selectedEmployee.id)
      : sorted;
  }, [events, selectedEmployee]);

  const assignSlotsToEvents = (
    events: CalendarEvent[]
  ): Record<string, number> => {
    const slotsPerDay: Record<string, number[]> = {};
    const eventSlots: Record<string, number> = {};

    events.forEach((event) => {
      const days: string[] = [];
      let current = event.startDate.startOf('day');
      const end = event.endDate.startOf('day');
      while (current.isSameOrBefore(end, 'day')) {
        days.push(current.format('YYYY-MM-DD'));
        current = current.add(1, 'day');
      }

      let slot = 0;
      while (days.some((day) => slotsPerDay[day]?.includes(slot))) slot++;
      eventSlots[event.id] = slot;

      days.forEach((day) => {
        if (!slotsPerDay[day]) slotsPerDay[day] = [];
        slotsPerDay[day].push(slot);
      });
    });

    return eventSlots;
  };

  const eventSlots = useMemo(
    () => assignSlotsToEvents(filteredEvents),
    [filteredEvents]
  );

  // ---------------------
  // Siatka miesiąca
  // ---------------------
  const generateMonthGrid = (month: Dayjs): Dayjs[][] => {
    const start = month.startOf('month').startOf('week');
    const end = month.endOf('month').endOf('week');
    const weeks: Dayjs[][] = [];
    let current = start;
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      weeks.push(
        Array.from({ length: 7 }, () => {
          const d = current;
          current = current.add(1, 'day');
          return d;
        })
      );
    }
    return weeks;
  };
  const monthGrid = useMemo(
    () => generateMonthGrid(currentMonth),
    [currentMonth]
  );
  const weekDays = ['Pon.', 'Wt.', 'Śr.', 'Czw.', 'Pt.', 'Sob.', 'Niedz.'];

  // ---------------------
  // Handlery
  // ---------------------
  const handleMonthChange = (action: 'prev' | 'next' | 'today' | Dayjs) =>
    setCurrentMonth((prev) =>
      action === 'prev'
        ? prev.subtract(1, 'month')
        : action === 'next'
          ? prev.add(1, 'month')
          : action === 'today'
            ? dayjs().startOf('month')
            : (action as Dayjs).startOf('month')
    );

  const handleFieldChange = (
    field: keyof EventFormData,
    value: string | Dayjs | null
  ) =>
    setFormState((prev) => ({
      ...prev,
      values: { ...prev.values, [field]: value },
      errors: {},
    }));

  const handleModalClose = () => {
    setActiveDialog({ type: 'none' });
    setFormState({
      values: { employee: null, startDate: null, endDate: null },
      errors: {},
      isSubmitting: false,
    });
    setStartSelecting(null);
  };

  const handleFormSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const validationErrors = validate(formState.values);
      if (Object.keys(validationErrors).length)
        return setFormState((prev) => ({ ...prev, errors: validationErrors }));
      updateMutation.mutate(formState.values);
    },
    [formState.values, updateMutation]
  );

  const handleDayClick = (day: Dayjs) => {
    if (!startSelecting) {
      setStartSelecting(day);
      handleFieldChange('startDate', day);
      handleFieldChange('endDate', null);
    } else {
      const start = startSelecting.isBefore(day) ? startSelecting : day;
      const end = startSelecting.isBefore(day) ? day : startSelecting;
      handleFieldChange('startDate', start);
      handleFieldChange('endDate', end);
      setStartSelecting(null);
      setActiveDialog({ type: 'addEvent' });
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setActiveDialog({ type: 'deleteEvent', event });
    setFormState((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        employee: employees.find((e) => e.id === event.employee.id) || null,
        startDate: event.startDate,
        endDate: event.endDate,
      },
    }));
  };

  const isDayInRange = (day: Dayjs) => {
    const { startDate, endDate } = formState.values;
    if (startSelecting && !endDate) return day.isSame(startSelecting, 'day');
    return (
      startDate && endDate && day.isBetween(startDate, endDate, 'day', '[]')
    );
  };

  const getColorForEmployee = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++)
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    const r = 150 + (hash % 60),
      g = 160 + ((hash >> 3) % 60),
      b = 200 + ((hash >> 6) % 55);
    const toHex = (x: number) => ('00' + x.toString(16)).slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  if (isLoading) return <Typography>Ładowanie...</Typography>;

  // ---------------------
  // Render
  // ---------------------
  return (
    <Box
      sx={{ padding: { xs: 1, sm: 2, md: 3 } }}
      className="border-lightGray m-4 rounded-lg border bg-white p-4"
    >
      {/* --- Nagłówek --- */}
      <Stack
        alignItems={'center'}
        direction={'row'}
        flexWrap={'wrap'}
        spacing={1}
        gap={1}
        mb={2}
      >
        <IconButton onClick={() => handleMonthChange('prev')}>
          <ChevronLeft />
        </IconButton>
        <Button
          size="small"
          variant="outlined"
          onClick={() => handleMonthChange('today')}
        >
          Dziś
        </Button>
        <IconButton onClick={() => handleMonthChange('next')}>
          <ChevronRight />
        </IconButton>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
          <DatePicker
            openTo="month"
            views={['year', 'month']}
            sx={{
              minWidth: 200,
              '& .MuiPickersSectionList-root': {
                padding: '7px 0',
                width: 'auto',
              },
            }}
            value={currentMonth}
            onChange={(value) => handleMonthChange(value as Dayjs)}
          />
        </LocalizationProvider>
        <FormControl sx={{ minWidth: 200, ml: 2 }}>
          <Autocomplete
            size="small"
            options={employees}
            getOptionLabel={(opt) => opt.name}
            value={selectedEmployee}
            onChange={(_, val) => setSelectedEmployee(val)}
            isOptionEqualToValue={(opt, val) => opt.id === val?.id}
            renderInput={(params) => (
              <TextField {...params} label="Filtr pracownika" />
            )}
          />
        </FormControl>
        <Typography
          variant="h5"
          component="h1"
          fontWeight={'medium'}
          sx={{
            ml: { xs: 0, sm: 2 },
            flexGrow: 1,
            textAlign: { xs: 'center', md: 'right' },
          }}
          textTransform={'capitalize'}
        >
          {currentMonth.format('MMMM YYYY')}
        </Typography>
      </Stack>
      {/* --- Siatka --- */}
      <Box
        sx={{ overflow: 'hidden', userSelect: 'none', position: 'relative' }}
        className="rounded-lg border border-gray-300"
      >
        <Grid container>
          {weekDays.map((day) => (
            <Grid
              size={{ xs: 12 / 7 }}
              key={day}
              sx={{ textAlign: 'center', p: 1 }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 'bold' }}
              >
                {day}
              </Typography>
            </Grid>
          ))}

          {monthGrid.map((week, wi) =>
            week.map((day, di) => {
              const isCurrentMonth = day.isSame(currentMonth, 'month');

              const dayEvents = filteredEvents.filter((e) =>
                day.isBetween(e.startDate, e.endDate, 'day', '[]')
              );

              return (
                <Grid
                  size={{ xs: 12 / 7 }}
                  key={`${wi}-${di}`}
                  className={`border-t border-t-gray-300 p-1 ${
                    isDayInRange(day) && 'bg-blue-100'
                  }`}
                  sx={{
                    borderLeft: di % 7 !== 0 ? '1px solid #ddd' : 'none',
                    minHeight: 120,
                    p: 0,
                    bgcolor: isCurrentMonth ? 'white' : '#fafafa',
                    ':hover': {
                      background: startSelecting ? 'lightskyblue' : '#f0f0f0',
                    },
                  }}
                  onClick={() => handleDayClick(day)}
                >
                  <Typography
                    textAlign={'center'}
                    sx={{ paddingTop: 0.15, opacity: isCurrentMonth ? 1 : 0.4 }}
                    variant="body2"
                  >
                    {day.date()}
                  </Typography>
                  <Box sx={{ mt: 0.5, position: 'relative', height: 5 * 22 }}>
                    {dayEvents.map((ev, index) => {
                      const slot = eventSlots[ev.id];
                      const isStart = day.isSame(ev.startDate, 'day');
                      const isEnd = day.isSame(ev.endDate, 'day');
                      // const isFirstDayOfWeek = di % 7 === 0;
                      // const isLastDayOfWeek = di % 7 === 6;

                      if (slot > 4) return null;

                      return (
                        <Tooltip
                          placement="top"
                          key={index}
                          title={ev.employee.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(ev);
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              top: slot * 22,
                              left: 0,
                              right: 0,
                              bgcolor:
                                getColorForEmployee(ev.employee.id) ||
                                'lightsteelblue',
                              px: 1,
                              my: 0.3,
                              ml: isStart ? 1 : '-4px',
                              mr: isEnd ? 1 : '-4px',
                              fontSize: '0.7rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: isStart ? 'dark' : 'transparent',
                              borderTopLeftRadius: isStart ? 10 : 0,
                              borderBottomLeftRadius: isStart ? 10 : 0,
                              borderTopRightRadius: isEnd ? 10 : 0,
                              borderBottomRightRadius: isEnd ? 10 : 0,
                              cursor: 'pointer',
                            }}
                          >
                            {ev.employee.name}
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                  {dayEvents.some((ev) => eventSlots[ev.id] > 4) && (
                    <Link
                      component="button"
                      underline="none"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDialog({ type: 'moreEvents', day });
                      }}
                      sx={{
                        fontSize: '0.7rem',
                        ':hover': { color: 'purple' },
                        width: '100%',
                        display: 'block',
                      }}
                    >
                      +{dayEvents.filter((ev) => eventSlots[ev.id] > 4).length}
                      <Typography
                        component={'span'}
                        sx={{
                          display: { xs: 'none', md: 'inline' },
                          ml: 0.5,
                          fontSize: '0.7rem',
                        }}
                      >
                        więcej
                      </Typography>
                    </Link>
                  )}
                </Grid>
              );
            })
          )}
        </Grid>
      </Box>

      {/* --- MODAL DODAWANIA WYDARZENIA --- */}
      <Dialog
        open={
          activeDialog.type === 'addEvent' ||
          activeDialog.type === 'deleteEvent'
        }
        onClose={handleModalClose}
        fullWidth
        maxWidth="sm"
      >
        <Box
          component="form"
          onSubmit={handleFormSubmit}
          noValidate
          autoComplete="off"
          sx={{ width: '100%' }}
        >
          <FormGroup>
            <DialogTitle>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  {activeDialog.type === 'addEvent'
                    ? 'Dodaj urlop'
                    : 'Szczegóły urlopu'}
                </Typography>
                <IconButton onClick={handleModalClose}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{ maxWidth: '100%' }}>
              <Autocomplete
                readOnly={activeDialog.type === 'deleteEvent'}
                options={employees || []}
                getOptionLabel={(option) => option.name}
                value={formState.values.employee || null}
                onChange={(_, newValue) =>
                  handleFieldChange('employee', newValue)
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pracownik"
                    required
                    error={
                      !!formState.errors.employee ||
                      !!formState.errors.startDate ||
                      !!formState.errors.endDate
                    }
                    helperText={formState.errors.employee}
                    sx={{ my: 1 }}
                  />
                )}
              />
              {formState.values.startDate && formState.values.endDate && (
                <Stack direction="row" alignItems="center" spacing={1} my={2}>
                  <Chip
                    label={formState.values.startDate.format('DD.MM.YYYY')}
                    color="primary"
                    variant="outlined"
                    sx={{ ml: 1, mr: 1 }}
                  />
                  <Typography>–</Typography>
                  <Chip
                    label={formState.values.endDate.format('DD.MM.YYYY')}
                    color="primary"
                    variant="outlined"
                    sx={{ ml: 1, mr: 1 }}
                  />
                </Stack>
              )}
              {(formState.errors.startDate || formState.errors.endDate) && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {formState.errors.startDate || formState.errors.endDate}
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              {activeDialog.type === 'deleteEvent' ? (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    deleteMutation.mutate(activeDialog.event);
                  }}
                >
                  Usuń
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={formState.isSubmitting}
                >
                  {formState.isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
                </Button>
              )}
            </DialogActions>
          </FormGroup>
        </Box>
      </Dialog>
      {/* --- MODAL ZWIĘKSZENIA WYDARZEŃ --- */}
      <Dialog
        open={activeDialog.type === 'moreEvents'}
        onClose={() => setActiveDialog({ type: 'none' })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Urlopy –{' '}
          {activeDialog.type === 'moreEvents' &&
            activeDialog.day.format('DD.MM.YYYY')}
        </DialogTitle>
        <DialogContent dividers sx={{ maxWidth: '100%' }}>
          {events
            .filter(
              (e) =>
                activeDialog.type === 'moreEvents' &&
                activeDialog.day?.isBetween(
                  e.startDate,
                  e.endDate,
                  'day',
                  '[]'
                ) &&
                (!selectedEmployee || e.employee?.id === selectedEmployee.id)
            )
            .map((event) => (
              <Box
                key={event.id}
                sx={{
                  p: 1,
                  mb: 1,
                  backgroundColor: getColorForEmployee(event.employee.id),
                  borderRadius: 1,
                  cursor: 'pointer',
                  ':hover': { opacity: 0.8 },
                }}
                onClick={() => handleEventClick(event)}
              >
                <Typography
                  variant="body2"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {event.employee?.name}
                </Typography>
                <Typography variant="caption">
                  {event.startDate.format('DD.MM.YYYY')} –{' '}
                  {event.endDate.format('DD.MM.YYYY')}
                </Typography>
              </Box>
            ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActiveDialog({ type: 'none' })}>
            Zamknij
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar;
