import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  CircularProgress,
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
import { getEmployeeList } from '../../../api/employees';
import type { Employee, Vacation } from '../../../types';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import {
  batchCreateVacations,
  getVacationList,
  getVacationListForMonths,
  removeVacation,
} from '../../../api/vacations';
import { flexGrow } from '@mui/system';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.locale('pl');

interface CalendarEvent {
  id: string;
  employee: { id: string; name: string };
  startDate: Dayjs;
  endDate: Dayjs;
  vacationIds: string[];
  groupId: string;
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

// Validation kept similar to original
const validateEvent = (
  values: EventFormState['values'],
  vacations: Vacation[]
): Partial<Record<'employeeId' | 'startDate' | 'endDate', string>> => {
  const errors: Partial<
    Record<'employeeId' | 'startDate' | 'endDate', string>
  > = {};

  if (!values.employeeId) errors.employeeId = 'Wybierz pracownika';
  if (!values.startDate) errors.startDate = 'Wybierz datę początkową';
  if (!values.endDate) errors.endDate = 'Wybierz datę końcową';

  if (
    values.startDate &&
    values.endDate &&
    values.startDate.isAfter(values.endDate, 'day')
  ) {
    errors.endDate = 'Data końcowa nie może być przed początkową';
  }

  if (values.employeeId && values.startDate && values.endDate) {
    let d = values.startDate;
    let conflict = false;
    while (!d.isAfter(values.endDate, 'day')) {
      if (
        vacations.some(
          (v) =>
            v.employeeId === values.employeeId &&
            v.date &&
            dayjs(v.date.toDate()).isSame(d, 'day')
        )
      ) {
        conflict = true;
        break;
      }
      d = d.add(1, 'day');
    }
    if (conflict) {
      errors.startDate = 'Pracownik ma już urlop w tym terminie';
      errors.endDate = 'Pracownik ma już urlop w tym terminie';
    }
  }

  return errors;
};

const getColorForEmployee = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const r = 150 + (hash % 60);
  const g = 160 + ((hash >> 3) % 60);
  const b = 200 + ((hash >> 6) % 55);
  const toHex = (x: number) => ('00' + x.toString(16)).slice(-2);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const WEEK_DAYS = ['Pon.', 'Wt.', 'Śr.', 'Czw.', 'Pt.', 'Sob.', 'Niedz.'];

const CalendarC: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(
    dayjs().startOf('month')
  );
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [startSelecting, setStartSelecting] = useState<Dayjs | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>({
    type: 'none',
  });
  const [formState, setFormState] = useState<EventFormState>({
    values: { employeeId: null, startDate: null, endDate: null },
    errors: {},
  });

  const notifications = useNotifications();
  const queryClient = useQueryClient();

  // Fetch active employees
  const { data: employees = [], isLoading: employeesLoading } = useQuery<
    Employee[]
  >({
    queryKey: ['employees'],
    queryFn: getEmployeeList,
    select: (data) => data.filter((e) => e.status),
  });

  // Visible months keys (prev, current, next)
  const getThreeMonthKeys = useCallback((month: Dayjs) => {
    return [-1, 0, 1].map((offset) => {
      const t = month.add(offset, 'month');
      return `${t.year()}-${(t.month() + 1).toString().padStart(2, '0')}`;
    });
  }, []);

  const visibleMonths = useMemo(
    () => getThreeMonthKeys(currentMonth),
    [currentMonth, getThreeMonthKeys]
  );

  // Fetch vacations for visible months only
  const { data: vacations = [], isLoading: vacationsLoading } = useQuery<
    Vacation[]
  >({
    queryKey: ['vacations', visibleMonths],
    queryFn: () => getVacationListForMonths(visibleMonths),
  });

  // create mutation using batch API: (employeeId, startDate: Date, endDate: Date)
  const createMutation = useMutation({
    mutationFn: async (payload: {
      employeeId: string;
      startDate: Dayjs;
      endDate: Dayjs;
      groupId: string;
    }) =>
      batchCreateVacations(
        payload.employeeId,
        payload.startDate.toDate(),
        payload.endDate.toDate(),
        payload.groupId
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      notifications.show('Pomyślnie utworzono urlop.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      handleModalClose();
      setIsSubmitting(false);
    },
    onError: (err: Error) => {
      notifications.show(`Błąd: ${err.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
      setIsSubmitting(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (event: CalendarEvent) => removeVacation(event.groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      notifications.show('Urlop został usunięty.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      handleModalClose();
      setIsSubmitting(false);
    },
    onError: (err: Error) => {
      notifications.show(`Błąd: ${err.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
      setIsSubmitting(false);
    },
  });

  const assignSlotsToEvents = useCallback((evts: CalendarEvent[]) => {
    const slotsPerDay: Record<string, number[]> = {};
    const eventSlots: Record<string, number> = {};

    for (const ev of evts) {
      const days: string[] = [];
      let cur = ev.startDate.startOf('day');
      const end = ev.endDate.startOf('day');
      while (cur.isSameOrBefore(end, 'day')) {
        days.push(cur.format('YYYY-MM-DD'));
        cur = cur.add(1, 'day');
      }

      let slot = 0;
      while (days.some((d) => slotsPerDay[d]?.includes(slot))) slot++;
      eventSlots[ev.id] = slot;

      for (const d of days) {
        slotsPerDay[d] ??= [];
        slotsPerDay[d].push(slot);
      }
    }

    return eventSlots;
  }, []);

  // Build calendar events: group consecutive days by employee
  const events = useMemo<CalendarEvent[]>(() => {
    if (!vacations.length || !employees.length) return [];

    // 1. ZOPTYMALIZOWANA MAPA PRACOWNIKÓW:
    // Tworzymy mapę dla szybkiego dostępu O(1) zamiast wyszukiwania O(n) w pętli.
    const employeeMap = employees.reduce(
      (acc, emp) => {
        acc[emp.id] = { id: emp.id, name: emp.name };
        return acc;
      },
      {} as Record<string, { id: string; name: string }>
    );

    // 2. Sortowanie (niezmienione, bo jest wymagane dla grupowania)
    const sortedVacations = [...vacations]
      .filter((v) => v.employeeId && v.date)
      .sort((a, b) => {
        if (a.employeeId !== b.employeeId)
          return a.employeeId.localeCompare(b.employeeId);
        return dayjs(a.date!.toDate()).diff(dayjs(b.date!.toDate()), 'day');
      });

    const groupedEvents: CalendarEvent[] = [];
    let current: CalendarEvent | null = null;

    // 3. Główna pętla z szybkim wyszukiwaniem
    for (const vac of sortedVacations) {
      // Szybkie wyszukiwanie: O(1) zamiast O(n)
      const empData = employeeMap[vac.employeeId!];

      // Używamy "empData", a nie "emp"
      if (!empData) continue;

      const date = dayjs(vac.date!.toDate());

      if (
        current &&
        current.employee.id === empData.id &&
        date.diff(current.endDate, 'day') === 1
      ) {
        // ten sam pracownik, kolejny dzień → wydłuż zakres
        current.endDate = date;
        current.vacationIds.push(vac.id);
      } else {
        // zamknij poprzedni event
        if (current) groupedEvents.push(current);

        // rozpocznij nowy event
        current = {
          id: `${empData.id}_${date.format('YYYYMMDD')}`,
          employee: empData, // Użyj danych z mapy
          startDate: date,
          endDate: date,
          vacationIds: [vac.id],
          // Dodany groupId jeśli jest potrzebny, na podstawie Twojego kodu
          groupId: (vac as any).groupId,
        };
      }
    }

    if (current) groupedEvents.push(current);

    // 4. Drugie sortowanie (niezmienione)
    return groupedEvents.sort((a, b) => {
      const diff = a.startDate.diff(b.startDate, 'day');
      if (diff !== 0) return diff;
      return (
        b.endDate.diff(b.startDate, 'day') - a.endDate.diff(a.startDate, 'day')
      );
    });
  }, [vacations, employees]);

  // 🔹 Teraz filteredEvents już tylko filtruje — bez sortowania
  const filteredEvents = useMemo<CalendarEvent[]>(() => {
    if (!selectedEmployees.length) return events;
    const ids = new Set(selectedEmployees.map((e) => e.id));
    return events.filter((e) => ids.has(e.employee.id));
  }, [events, selectedEmployees]);

  const eventSlots = useMemo(
    () => assignSlotsToEvents(filteredEvents),
    [filteredEvents, assignSlotsToEvents]
  );

  const generateMonthGrid = useCallback((month: Dayjs) => {
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
  }, []);

  const monthGrid = useMemo(
    () => generateMonthGrid(currentMonth),
    [currentMonth, generateMonthGrid]
  );

  // Handlers
  const handleMonthChange = useCallback(
    (action: 'prev' | 'next' | 'today' | Dayjs) => {
      setCurrentMonth((prev) =>
        action === 'prev'
          ? prev.subtract(1, 'month')
          : action === 'next'
            ? prev.add(1, 'month')
            : action === 'today'
              ? dayjs().startOf('month')
              : (action as Dayjs).startOf('month')
      );
    },
    []
  );

  const handleFieldChange = useCallback(
    (field: keyof EventFormState['values'], value: string | Dayjs | null) => {
      setFormState((prev) => ({
        ...prev,
        values: { ...prev.values, [field]: value },
        errors: {},
      }));
    },
    []
  );

  const handleModalClose = useCallback(() => {
    setActiveDialog({ type: 'none' });
    setFormState({
      values: { employeeId: null, startDate: null, endDate: null },
      errors: {},
    });
    setStartSelecting(null);
  }, []);

  const handleFormSubmit = useCallback(
    async (evt: React.FormEvent<HTMLFormElement>) => {
      evt.preventDefault();
      const { employeeId, startDate, endDate } = formState.values;
      const validationErrors = validateEvent(formState.values, vacations);
      if (Object.keys(validationErrors).length) {
        setFormState((prev) => ({ ...prev, errors: validationErrors }));
        return;
      }

      if (!employeeId || !startDate || !endDate) return;

      const groupId = `${employeeId}${startDate.format('DDMMYYYY')}`;

      setIsSubmitting(true);
      // call batch API
      await createMutation.mutateAsync({
        employeeId,
        startDate,
        endDate,
        groupId,
      });
    },
    // intentionally list dependencies that could change
    [formState.values, vacations, createMutation]
  );

  const handleDayClick = useCallback(
    (day: Dayjs) => {
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
    },
    [startSelecting, handleFieldChange]
  );

  const handleEventClick = useCallback((ev: CalendarEvent) => {
    setActiveDialog({ type: 'deleteEvent', event: ev });
    setFormState((prev) => ({
      ...prev,
      values: {
        employeeId: ev.employee.id,
        startDate: ev.startDate,
        endDate: ev.endDate,
      },
      errors: {},
    }));
  }, []);

  const isDayInRange = useCallback(
    (day: Dayjs) => {
      const { startDate, endDate } = formState.values;
      if (startSelecting && !endDate) return day.isSame(startSelecting, 'day');
      return (
        !!startDate &&
        !!endDate &&
        day.isBetween(startDate, endDate, 'day', '[]')
      );
    },
    [formState.values, startSelecting]
  );

  // keyboard escape to cancel selection
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStartSelecting(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // ---------------------
  // Render
  // ---------------------
  return (
    <Box
      sx={{ padding: { xs: 1, sm: 2, md: 3 }, pb: 4 }}
      className="relative"
      // className="border-lightGray m-4 rounded-lg border bg-white p-4"
    >
      {(employeesLoading || vacationsLoading) && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            zIndex: 100,
            borderRadius: 'inherit',
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <IconButton
        size="large"
        sx={{
          color: 'red',
          position: 'fixed',
          bottom: 25,
          right: 25,
          zIndex: 100,
          // borderColor: 'lightskyblue',
          display: {
            xs: startSelecting ? 'flex' : 'none',
            sm: 'none',
          },
        }}
        className="border bg-red-100"
        onClick={() => setStartSelecting(null)}
      >
        <CloseIcon />
      </IconButton>

      {/* --- Nagłówek --- */}

      <Stack
        alignItems={'center'}
        direction={'row'}
        flexWrap={'wrap'}
        justifyContent={'flex-start'}
        gap={2}
        mb={1}
        width={'100%'}
        className={
          'border-lightGray rounded-lg border bg-gray-100/40 px-3 py-4 md:py-3'
        }
      >
        <Stack direction={'row'}>
          <IconButton
            size="small"
            className="rounded-l-lg rounded-r-none border text-blue-300"
            onClick={() => handleMonthChange('prev')}
          >
            <ChevronLeft />
          </IconButton>
          <Button
            // size="small"
            variant="outlined"
            className="rounded-none border-x-0"
            onClick={() => handleMonthChange('today')}
          >
            Dziś
          </Button>
          <IconButton
            size="small"
            className="rounded-l-none rounded-r-lg border text-blue-300"
            onClick={() => handleMonthChange('next')}
          >
            <ChevronRight />
          </IconButton>
        </Stack>
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
            onChange={(value) => {
              if (!value) {
                return;
              }
              handleMonthChange(value as Dayjs);
            }}
          />
        </LocalizationProvider>
        <Stack direction={'row'} alignItems={'center'} spacing={1}>
          <IconButton
            sx={{
              color: 'royalblue',
            }}
            size="small"
            className="rounded-lg border"
            onClick={() => setIsFilterOpen(true)}
          >
            <FilterListIcon />
          </IconButton>
          {/* <IconButton
              sx={{
                borderRadius: 0,
              }}
              onClick={() => setSelectedEmployees([])}
            >
              <FilterListOffIcon />
            </IconButton> */}
        </Stack>
        <Stack
          sx={{ flexGrow: 1 }}
          alignItems={'center'}
          direction={'row'}
          flexWrap={'wrap'}
          justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
        >
          <Typography
            variant="h5"
            component="h1"
            fontWeight={'medium'}
            textTransform={'capitalize'}
            className="border-dark rounded-lg border bg-white px-4 py-1"
          >
            {currentMonth.format('MMMM YYYY')}

            {/* <Chip
              label={
                filteredEvents.filter((e) => {
                  const start = dayjs(e.startDate);
                  const end = dayjs(e.endDate);
                  return (
                    start.isSame(currentMonth, 'month') ||
                    end.isSame(currentMonth, 'month') ||
                    currentMonth.isBetween(start, end, 'month', '[]')
                  );
                }).length
              }
            /> */}
          </Typography>
        </Stack>
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
          <DialogContent
            dividers
            sx={{
              minHeight: 150,
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
          <DialogActions>
            <Button onClick={() => setSelectedEmployees([])}>Wyczyść</Button>
          </DialogActions>
        </Dialog>
      </Stack>
      {/* --- Siatka --- */}
      <Box
        sx={{ overflow: 'hidden', userSelect: 'none', position: 'relative' }}
        className="rounded-lg border border-gray-300"
      >
        <Grid container>
          {WEEK_DAYS.map((day) => (
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

              console.log('dayrender');

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
                      width: { xs: '5px', md: '10px' },
                      height: { xs: '5px', md: '10px' },
                      right: { xs: '5px', md: '10px' },
                      top: { xs: '5px', md: '10px' },
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
                  <Box sx={{ mt: 0.5, position: 'relative', height: 5 * 25 }}>
                    {dayEvents.map((ev, index) => {
                      const slot = eventSlots[ev.id];
                      const isStart = day.isSame(ev.startDate, 'day');
                      const isEnd = day.isSame(ev.endDate, 'day');
                      // const isFirstDayOfWeek = di % 7 === 0;
                      // const isLastDayOfWeek = di % 7 === 6;

                      if (slot > 3) return null;

                      return (
                        <Tooltip
                          disableTouchListener
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
                              top: slot * 23,
                              left: 0,
                              right: 0,
                              bgcolor:
                                getColorForEmployee(ev.employee.id) ||
                                'lightsteelblue',
                              px: 1,
                              my: 0.3,
                              ml: isStart ? 1 : '-5px',
                              mr: isEnd ? 1 : '-5px',
                              fontSize: '0.7rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              // zIndex: 10,
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
                  {/* {dayEvents.some((ev) => eventSlots[ev.id] > 4) && ( */}
                  {dayEvents.length > 1 && (
                    <Link
                      component="button"
                      underline="none"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDialog({ type: 'moreEvents', day });
                      }}
                      sx={{
                        fontSize: '0.75rem',
                        ':hover': { color: 'purple' },
                        width: '100%',
                        display: 'block',
                        position: 'absolute',
                        bottom: 2,
                        left: 0,
                        right: 0,
                      }}
                    >
                      {dayEvents.length > 4 && dayEvents.length % 4}
                      {/* <Button
                        size="small"
                        variant="text"
                        startIcon={<MoreHorizIcon />}
                      >
                       
                      </Button> */}
                      {/* +{dayEvents.filter((ev) => eventSlots[ev.id] > 4).length}
                      <Typography
                        component={'span'}
                        sx={{
                          display: { xs: 'none', md: 'inline' },
                          ml: 0.5,
                          fontSize: '0.75rem',
                        }}
                      >
                        więcej
                      </Typography> */}
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
                    setIsSubmitting(true);
                    deleteMutation.mutate(activeDialog.event);
                  }}
                  loading={isSubmitting}
                >
                  Usuń
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  loading={isSubmitting}
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

export default CalendarC;
