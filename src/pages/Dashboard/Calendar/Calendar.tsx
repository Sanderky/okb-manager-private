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
  Checkbox,
  Icon,
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
import type { Employee, Vacation } from '../../../types';
import useNotifications from '../../../hooks/useNotifications/useNotifications';

import FilterListIcon from '@mui/icons-material/FilterList';

import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import {
  createVacation,
  getVacationList,
  removeVacation,
} from '../../../api/vacations';

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

interface EventFormState {
  values: {
    employeeId: string | null;
    startDate: Dayjs | null;
    endDate: Dayjs | null;
  };
  errors: Partial<Record<'employeeId' | 'startDate' | 'endDate', string>>;
}

type ActiveDialog =
  | { type: 'none' }
  | { type: 'addEvent' }
  | { type: 'moreEvents'; day: Dayjs }
  | { type: 'deleteEvent'; event: CalendarEvent };

// ---------------------
// Walidacja formularza
// ---------------------
const validate = (
  values: Vacation,
  vacations: Vacation[]
): Partial<Record<keyof Vacation, string>> => {
  const errors: Partial<Record<keyof Vacation, string>> = {};

  if (!values.employeeId) {
    errors.employeeId = 'Wybierz pracownika';
  }
  if (!values.startDate) {
    errors.startDate = 'Wybierz datę początkową';
  }
  if (!values.endDate) {
    errors.endDate = 'Wybierz datę końcową';
  }
  if (
    values.startDate &&
    values.endDate &&
    new Date(values.startDate) > new Date(values.endDate)
  ) {
    errors.endDate = 'Data końcowa nie może być przed początkową';
  }

  if (values.employeeId && values.startDate && values.endDate) {
    const hasConflict = vacations.some(
      (vac) =>
        vac.employeeId === values.employeeId &&
        vac.id !== values.id &&
        vac.startDate &&
        vac.endDate &&
        dayjs(values.startDate).isSameOrBefore(dayjs(vac.endDate), 'day') &&
        dayjs(values.endDate).isSameOrAfter(dayjs(vac.startDate), 'day')
    );
    if (hasConflict) {
      errors.startDate = 'Pracownik ma już urlop w tym terminie';
      errors.endDate = 'Pracownik ma już urlop w tym terminie';
    }
  }

  return errors;
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

// ---------------------
// Komponent główny
// ---------------------
const Calendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(
    dayjs().startOf('month')
  );
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [startSelecting, setStartSelecting] = useState<Dayjs | null>(null);

  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const [activeDialog, setActiveDialog] = useState<ActiveDialog>({
    type: 'none',
  });

  const [formState, setFormState] = useState<EventFormState>({
    values: { employeeId: null, startDate: null, endDate: null },
    errors: {},
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) =>
      e.key === 'Escape' && setStartSelecting(null);
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: employees = [], isLoading: employeesLoading } = useQuery<
    Employee[]
  >({
    queryKey: ['employees'],
    queryFn: getEmployeeList,
    select: (data) => data.filter((e) => e.status),
  });

  const { data: vacations = [], isLoading: vacationsLoading } = useQuery<
    Vacation[]
  >({
    queryKey: ['vacations'],
    queryFn: getVacationList,
  });

  // ---------------------
  // Mutacje
  // ---------------------
  const createMutation = useMutation({
    mutationFn: (data: Partial<Vacation>) => createVacation(data as Vacation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      notifications.show('Pomyślnie utworzono urlop.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      handleModalClose();
    },
    onError: (error: Error) => {
      notifications.show(`Błąd: ${error.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (event: CalendarEvent) => removeVacation(event.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      notifications.show('Urlop został usunięty.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      handleModalClose();
    },
  });

  // ---------------------
  // Generowanie wydarzeń
  // ---------------------
  const events = useMemo(() => {
    return vacations
      .map((vac) => {
        const emp = employees.find((e) => e.id === vac.employeeId);
        if (!emp) return null;

        return {
          id: vac.id,
          employee: { id: emp.id, name: emp.name },
          startDate: vac.startDate ? dayjs(vac.startDate) : dayjs(),
          endDate: vac.endDate ? dayjs(vac.endDate) : dayjs(),
        } as CalendarEvent;
      })
      .filter((e): e is CalendarEvent => e !== null);
  }, [vacations, employees]);

  const filteredEvents = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) =>
        a.startDate.diff(b.startDate, 'day') ||
        b.endDate.diff(b.startDate, 'day') - a.endDate.diff(b.startDate, 'day')
    );
    if (!selectedEmployees.length) return sorted;
    const ids = new Set(selectedEmployees.map((e) => e.id));
    return sorted.filter((e) => ids.has(e.employee.id));
  }, [events, selectedEmployees]);

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
    field: keyof EventFormState['values'],
    value: string | Dayjs | null
  ) => {
    setFormState((prev) => ({
      ...prev,
      values: { ...prev.values, [field]: value },
      errors: {},
    }));
  };
  const handleModalClose = () => {
    setActiveDialog({ type: 'none' });
    setFormState({
      values: { employeeId: null, startDate: null, endDate: null },
      errors: {},
    });
    setStartSelecting(null);
  };

  const handleFormSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const validationErrors = validate(
        formState.values as Vacation,
        vacations
      );
      if (Object.keys(validationErrors).length)
        return setFormState((prev) => ({ ...prev, errors: validationErrors }));
      createMutation.mutate({
        ...formState.values,
        startDate: formState.values.startDate
          ? formState.values.startDate.toDate()
          : null,
        endDate: formState.values.endDate
          ? formState.values.endDate.toDate()
          : null,
      });
    },
    [formState.values, createMutation]
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
        employeeId: event.employee.id,
        startDate: event.startDate,
        endDate: event.endDate,
      },
      errors: {},
    }));
  };

  const isDayInRange = (day: Dayjs) => {
    const { startDate, endDate } = formState.values;
    if (startSelecting && !endDate) return day.isSame(startSelecting, 'day');
    return (
      startDate && endDate && day.isBetween(startDate, endDate, 'day', '[]')
    );
  };

  // if (isLoading) return <Typography>Ładowanie...</Typography>;

  if (employeesLoading || vacationsLoading)
    return <Typography>Ładowanie...</Typography>;

  // ---------------------
  // Render
  // ---------------------
  return (
    <Box
      sx={{ padding: { xs: 1, sm: 2, md: 3 } }}
      // className="border-lightGray m-4 rounded-lg border bg-white p-4"
    >
      {/* --- Nagłówek --- */}

      <Stack
        alignItems={'center'}
        direction={'row'}
        flexWrap={'wrap'}
        spacing={1}
        gap={2}
        mb={2}
      >
        <Stack
          alignItems={'center'}
          direction={'row'}
          flexWrap={'wrap'}
          justifyContent={'center'}
          spacing={1}
          gap={1}
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
          {/* <FormControl sx={{ minWidth: 200, ml: 2 }}>
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
          </FormControl> */}
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setIsFilterOpen(true)}
          >
            Filtr pracowników
          </Button>
          <IconButton onClick={() => setSelectedEmployees([])}>
            <FilterListOffIcon />
          </IconButton>
          <Dialog
            open={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
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
            <DialogContent dividers>
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
                  isOptionEqualToValue={(option, value) =>
                    option.id === value?.id
                  }
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
            {/* <DialogActions>
              <Button onClick={() => setSelectedEmployees([])}>Wyczyść</Button>
              <Button
                onClick={() => setIsFilterOpen(false)}
                variant="contained"
              >
                Zastosuj
              </Button>
            </DialogActions> */}
          </Dialog>
        </Stack>
        <Typography
          variant="h5"
          component="h1"
          fontWeight={'medium'}
          sx={{
            ml: { xs: 0, sm: 2 },
            flexGrow: 1,
            textAlign: { xs: 'center', lg: 'right' },
          }}
          textTransform={'capitalize'}
        >
          <span className="border-dark rounded-lg border px-4 py-1">
            {currentMonth.format('MMMM YYYY')}
          </span>
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
                sx={{ fontWeight: '700' }}
              >
                {day}
              </Typography>
            </Grid>
          ))}

          {monthGrid.map((week, wi) =>
            week.map((day, di) => {
              const isCurrentMonth = day.isSame(currentMonth, 'month');

              const dayEvents = filteredEvents.filter((e) => {
                return day.isBetween(e.startDate, e.endDate, 'day', '[]');
              });

              // console.log(filteredEvents);

              const isToday = day.isSame(dayjs(), 'day');

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
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      display: isToday ? 'block' : 'none',
                      width: '10px',
                      height: '10px',
                      right: 10,
                      top: 10,
                      position: 'absolute',
                      borderRadius: '50%',
                      border: '1px solid #777',
                      bgcolor: '#ffd85f',
                      boxSizing: 'content-box',
                      zIndex: 5,
                      pointerEvents: 'none',
                    },
                  }}
                  onClick={() => handleDayClick(day)}
                >
                  <Typography
                    textAlign={'center'}
                    sx={{
                      paddingTop: 0.15,
                      opacity: isCurrentMonth ? 1 : 0.4,
                      fontWeight: '500',
                    }}
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
                          arrow
                          placement="top"
                          key={index}
                          title={ev.employee.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(ev);
                          }}
                          slotProps={{
                            popper: {
                              modifiers: [
                                {
                                  name: 'offset',
                                  options: {
                                    offset: [0, -5],
                                  },
                                },
                              ],
                            },
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
                              color: isStart || isEnd ? 'dark' : 'transparent',
                              // textShadow:
                              //   isStart || isEnd
                              //     ? '1px 0 #fff, -1px 0 #fff, 0 1px #fff, 0 -1px #fff'
                              //     : undefined,
                              borderTopLeftRadius: isStart ? 10 : 0,
                              borderBottomLeftRadius: isStart ? 10 : 0,
                              borderTopRightRadius: isEnd ? 10 : 0,
                              borderBottomRightRadius: isEnd ? 10 : 0,
                              cursor: 'pointer',
                              fontWeight: '400',
                              textAlign: isEnd ? 'right' : 'left',
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
                value={
                  employees.find(
                    (emp) => emp.id === formState.values.employeeId
                  ) || null
                }
                onChange={(_, newValue) =>
                  handleFieldChange('employeeId', newValue ? newValue.id : null)
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pracownik"
                    required
                    error={
                      !!formState.errors.employeeId ||
                      !!formState.errors.startDate ||
                      !!formState.errors.endDate
                    }
                    helperText={formState.errors.employeeId}
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
            <DialogActions sx={{ px: 3, py: 2 }}>
              {activeDialog.type === 'deleteEvent' ? (
                <Button
                  variant="outlined"
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
                  //disabled={formState.isSubmitting}
                >
                  Zapisz
                  {/* {formState.isSubmitting ? 'Zapisywanie...' : 'Zapisz'} */}
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
                (selectedEmployees.length === 0 ||
                  selectedEmployees.some((emp) => emp.id === e.employee.id))
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
