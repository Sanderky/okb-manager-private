import {
  Alert,
  Autocomplete,
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  Link,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeeList } from '../../../api/employees';
import type { Employee, Vacation } from '../../../types';
import {
  createVacation,
  getVacationList,
  removeVacation,
} from '../../../api/vacations';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import {
  ChevronLeft,
  ChevronRight,
  Close as CloseIcon,
} from '@mui/icons-material';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import React from 'react';
import { Timestamp } from 'firebase/firestore';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import DeleteIcon from '@mui/icons-material/Delete';

interface CalendarEvent {
  id?: string;
  employee: Employee;
  date: Dayjs;
  startDate: Dayjs;
  endDate: Dayjs;
  groupId: string;
}

interface CalendarDay {
  date: Dayjs;
  events: CalendarEvent[];
  slots?: Record<string, number>;
}

type ActiveDialog =
  | { type: 'none' }
  | { type: 'addEvent' }
  | { type: 'eventDetails' }
  | { type: 'moreEvents'; day: CalendarDay };

const WEEK_DAYS = ['Pon.', 'Wt.', 'Śr.', 'Czw.', 'Pt.', 'Sob.', 'Niedz.'];

interface CalendarGridProps {
  monthGrid: CalendarDay[][];
  currentMonth: Dayjs;
  selectDay: Dayjs | null;
  onDayClick: (day: Dayjs) => void;
  isDayInRange: (day: Dayjs) => boolean;
  handleEventClick: (event: CalendarEvent) => void;
  setActiveDialog: (dialog: ActiveDialog) => void;
}

const pastelColors = [
  '#AEC6CF', // pastelowy błękit
  '#BFD8B8', // jasna zieleń
  '#C2B9B0', // ciepły taupe
  '#E6CBA8', // piaskowy beż
  '#F5DD90', // pastelowy bursztyn
  '#A8C3BC', // morska zieleń
  '#C1C8E4', // chłodny błękit-lilia
  '#D5E1DF', // szaro-miętowy
  '#E2CFC4', // kremowy róż (bardzo stonowany)
  '#C5D5CB', // szarawa zieleń
  '#D0B8A8', // ciepły kremowy brąz
  '#BFCBA8', // oliwkowo-miętowy
  '#C7D3D4', // jasny stalowy
  '#E0D8B0', // waniliowy pastel
  '#B5C9C3', // chłodny seledyn
  '#D4C5C7', // przytłumiony róż
  '#BACDB0', // jasna oliwka
  '#C7BEA2', // kremowy beż z nutą szarości
  '#A7BBC7', // stalowo-błękitny
  '#D9CAB3', // ciepły beżowy
];

const getColorForEmployee = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % pastelColors.length;
  return pastelColors[index];
};

const validateVacation = (
  employeeId: string,
  startDate: Dayjs,
  endDate: Dayjs,
  vacations: Vacation[]
): { isValid: boolean; error?: string } => {
  if (!employeeId) {
    return { isValid: false, error: 'Wybierz pracownika' };
  }

  if (!startDate || !endDate) {
    return { isValid: false, error: 'Wybierz zakres dat' };
  }

  let currentDate = startDate;
  const conflictingDates: string[] = [];

  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
    const hasConflict = vacations.some(
      (vacation) =>
        vacation.employeeId === employeeId &&
        dayjs(vacation.date.toDate()).isSame(currentDate, 'day')
    );

    if (hasConflict) {
      conflictingDates.push(currentDate.format('DD.MM.YYYY'));
    }

    currentDate = currentDate.add(1, 'day');
  }

  if (conflictingDates.length > 0) {
    return {
      isValid: false,
      error: `Pracownik ma już urlop w dniach: ${conflictingDates.join(', ')}`,
    };
  }

  return { isValid: true };
};

// const getInitials = (name: string): string => {
//   if (!name?.trim()) return '';

//   const parts = name.trim().split(/\s+/);
//   const first = parts[0]?.charAt(0) ?? '';
//   const last = parts[parts.length - 1]?.charAt(0) ?? '';

//   return `${first}. ${last}.`.toUpperCase();
// };

const CalendarGrid: React.FC<CalendarGridProps> = React.memo(
  ({
    monthGrid,
    currentMonth,
    selectDay,
    onDayClick,
    isDayInRange,
    handleEventClick,
    setActiveDialog,
  }) => {
    // console.log('CalendarGrid render');

    const getInitials = (name: string): string => {
      if (!name?.trim()) return '';

      const parts = name.trim().split(/\s+/);
      const first = parts[0]?.charAt(0) ?? '';
      const last = parts[parts.length - 1]?.charAt(0) ?? '';

      return `${first}. ${last}.`.toUpperCase();
    };

    return (
      <Grid container>
        {/* Dni tygodnia */}
        {WEEK_DAYS.map((day, index) => (
          <Grid
            size={{ xs: 12 / 7 }}
            key={index}
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

        {/* Komórki kalendarza */}
        {monthGrid.map((week, wi) =>
          week.map((calendarDay, di) => {
            const { date: day, events, slots = {} } = calendarDay;
            const isCurrentMonth = day.isSame(currentMonth, 'month');
            const isToday = day.isSame(dayjs(), 'day');
            const isSelected = isDayInRange(day);

            return (
              <Grid
                size={{ xs: 12 / 7 }}
                key={`${wi}-${di}`}
                className={`border-t border-t-gray-300 p-1 ${isSelected && 'bg-blue-100'}`}
                sx={{
                  borderLeft: di % 7 !== 0 ? '1px solid #ddd' : 'none',
                  minHeight: 140,
                  p: '0 !important',
                  bgcolor: isCurrentMonth ? 'white' : '#fafafa',
                  ':hover': {
                    background: selectDay ? 'lightskyblue' : '#f0f0f0',
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
                onClick={() => onDayClick(day)}
              >
                <Typography
                  textAlign={'center'}
                  sx={{
                    opacity: isCurrentMonth ? 1 : 0.4,
                    fontWeight: '500',
                    pt: 1,
                    pb: 0.5,
                  }}
                  variant="body2"
                >
                  {day.date()}
                </Typography>
                <Box
                  sx={{
                    position: 'relative',
                    height: 4 * 23,
                  }}
                >
                  {events.map((ev, index) => {
                    const isStart = ev.date.isSame(ev.startDate);
                    const isEnd = ev.date.isSame(ev.endDate);
                    const slot = slots[ev.groupId];

                    if (slot > 3 || !ev.employee) return null;

                    return (
                      <Tooltip
                        arrow
                        placement="top"
                        key={index}
                        title={ev.employee?.name}
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
                            bgcolor: getColorForEmployee(ev.employee.id),
                            px: 1,
                            ml: isStart ? 1 : '-5px',
                            mr: isEnd ? 1 : '-5px',
                            fontSize: '0.7rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: isStart || isEnd ? 'dark' : 'transparent',
                            borderTopLeftRadius: isStart ? 10 : 0,
                            borderBottomLeftRadius: isStart ? 10 : 0,
                            borderTopRightRadius: isEnd ? 10 : 0,
                            borderBottomRightRadius: isEnd ? 10 : 0,
                            cursor: 'pointer',
                            fontWeight: '400',
                            textAlign: isStart ? 'left' : 'right',
                            // display: 'flex',
                            // alignItems: 'center',
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 'inherit',
                              display: { xs: 'none', sm: 'block' },
                            }}
                          >
                            {ev.employee.name}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 'inherit',
                              display: { xs: 'block', sm: 'none' },
                            }}
                          >
                            {getInitials(ev.employee.name)}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
                {events.length > 1 && (
                  <Link
                    component="button"
                    underline="none"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDialog({ type: 'moreEvents', day: calendarDay });
                    }}
                    sx={{
                      fontSize: { xs: '0.6rem', md: '0.75rem' },
                      ':hover': { color: 'purple' },
                      width: '100%',
                      display: 'block',
                      position: 'absolute',
                      bottom: 2,
                      left: 0,
                      right: 0,
                    }}
                  >
                    {/* {events.length > 4 && `+ ${events.length % 4} `} */}
                    więcej
                  </Link>
                )}
              </Grid>
            );
          })
        )}
      </Grid>
    );
  }
);

const Calendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(
    dayjs().startOf('month')
  );
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [selectDay, setSelectDay] = useState<Dayjs | null>(null);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>({
    type: 'none',
  });
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent>(
    {} as CalendarEvent
  );
  const [validationError, setValidationError] = useState<string>('');

  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
    isError: isErrorEmployees,
  } = useQuery<Employee[], Error>({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
  });

  const {
    data: vacations = [],
    isLoading: isLoadingVacations,
    isError: isErrorVacations,
  } = useQuery<Vacation[], Error>({
    queryKey: ['vacations'],
    queryFn: getVacationList,
  });

  const { mutate: addMutation } = useMutation({
    mutationFn: (payload: Vacation[]) => createVacation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      notifications.show('Pomyślnie utworzono urlop.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      handleModalClose();
    },
    onError: (err: Error) => {
      notifications.show(`Błąd: ${err.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
    },
  });

  const { mutate: deleteMutation } = useMutation({
    mutationFn: (id: string) => removeVacation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      notifications.show('Pomyślnie usunięto urlop.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      handleModalClose();
    },
    onError: (err: Error) => {
      notifications.show(`Błąd: ${err.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
    },
  });

  const handleMonthChange = useCallback((action: 'prev' | 'next' | 'today') => {
    setCurrentMonth((prev) => {
      switch (action) {
        case 'prev':
          return prev.subtract(1, 'month');
        case 'today':
          return dayjs().startOf('month');
        case 'next':
          return prev.add(1, 'month');
        default:
          return prev;
      }
    });
  }, []);

  const generateMonthGrid = useCallback(
    (month: Dayjs) => {
      const start = month.startOf('month').startOf('week');
      const end = month.endOf('month').endOf('week');
      const weeks: CalendarDay[][] = [];
      let current = start.clone();

      const filteredEvents =
        selectedEmployees.length > 0
          ? vacations.filter((vacation) =>
              selectedEmployees.some((emp) => emp.id === vacation.employeeId)
            )
          : vacations;

      const groupSlotMap: Record<string, number> = {};
      const activeSlots: Record<number, string> = {};

      const getFreeSlot = (): number => {
        let slot = 0;
        while (activeSlots[slot] !== undefined) slot++;
        return slot;
      };

      while (current.isBefore(end) || current.isSame(end, 'day')) {
        const week: CalendarDay[] = [];

        for (let i = 0; i < 7; i++) {
          const filteredDayEvents = filteredEvents.filter((event: Vacation) =>
            current.isSame(dayjs(event.date.toDate()), 'day')
          );

          const newDayEvents: CalendarEvent[] = filteredDayEvents.map(
            ({ employeeId, ...ev }) => {
              const employee = employees.find((e) => e.id === employeeId);
              return {
                ...ev,
                endDate: dayjs(ev.endDate.toDate()),
                startDate: dayjs(ev.startDate.toDate()),
                date: dayjs(ev.date.toDate()),
                employee: employee!,
              };
            }
          );

          const sortedDayEvents = newDayEvents.sort((a, b) => {
            const durationA = a.endDate.diff(a.startDate, 'day');
            const durationB = b.endDate.diff(b.startDate, 'day');
            return durationB - durationA;
          });

          sortedDayEvents.map((ev) => {
            const gid = ev.groupId;
            if (
              current.isSame(ev.startDate, 'day') &&
              groupSlotMap[gid] === undefined
            ) {
              const free = getFreeSlot();
              groupSlotMap[gid] = free;
              activeSlots[free] = gid;
            }
          });

          week.push({
            date: current,
            events: sortedDayEvents,
            slots: groupSlotMap,
          });

          sortedDayEvents.map((ev) => {
            const gid = ev.groupId;
            if (current.isSame(ev.endDate, 'day')) {
              delete activeSlots[groupSlotMap[gid]];
            }
          });

          current = current.add(1, 'day');
        }

        weeks.push(week);
      }

      return weeks;
    },
    [vacations, employees, selectedEmployees]
  );

  const monthGrid = useMemo(
    () => generateMonthGrid(currentMonth),
    [currentMonth, generateMonthGrid]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleModalClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleDayClick = useCallback(
    (day: Dayjs) => {
      if (!selectDay) {
        setSelectDay(day);
        setCurrentEvent((prev) => ({
          ...prev,
          startDate: day,
        }));
      } else {
        const start = selectDay.isBefore(day) ? selectDay : day;
        const end = selectDay.isBefore(day) ? day : selectDay;
        setCurrentEvent((prev) => ({
          ...prev,
          startDate: start,
          endDate: end,
        }));
        setActiveDialog({ type: 'addEvent' });
      }
    },
    [selectDay]
  );

  const handleModalClose = useCallback(() => {
    setActiveDialog({ type: 'none' });
    setCurrentEvent({} as CalendarEvent);
    setSelectDay(null);
    setValidationError('');
  }, []);

  const isDayInRange = useCallback(
    (day: Dayjs) => {
      if (!currentEvent.startDate) return false;

      const dayStart = day.startOf('day');
      const startDate = currentEvent.startDate.startOf('day');

      if (!currentEvent.endDate) {
        return dayStart.isSame(startDate);
      } else {
        const endDate = currentEvent.endDate.startOf('day');
        return dayStart >= startDate && dayStart <= endDate;
      }
    },
    [currentEvent.startDate, currentEvent.endDate]
  );

  const handleEmployeeChange = useCallback((newValue: Employee) => {
    setCurrentEvent((prev) => ({
      ...prev,
      employee: newValue,
    }));
    setValidationError('');
  }, []);

  const handleDatePickerChange = useCallback((value: Dayjs | null) => {
    if (value) {
      setCurrentMonth(value);
    }
  }, []);

  const handleAddEvent = () => {
    if (!currentEvent) return;

    const { employee, startDate, endDate } = currentEvent;

    const validation = validateVacation(
      employee?.id || '',
      startDate,
      endDate,
      vacations
    );

    if (!validation.isValid) {
      setValidationError(validation.error || 'Wystąpił błąd walidacji');
      return;
    }

    const groupId = `${employee.id}${startDate.format('DDMMYYYY')}`;

    let currentDate = dayjs(startDate);

    const eventList: Vacation[] = [];

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
      eventList.push({
        employeeId: employee.id,
        startDate: Timestamp.fromDate(startDate.toDate()),
        endDate: Timestamp.fromDate(endDate.toDate()),
        groupId: groupId,
        date: Timestamp.fromDate(currentDate.toDate()),
        yearMonth: currentDate.format('YYYY-MM'),
      });
      currentDate = currentDate.add(1, 'day');
    }

    addMutation(eventList);
  };

  const handleDeleteEvent = (id?: string) => {
    const { groupId } = currentEvent;

    if (!groupId && !id) return;

    if (id) {
      deleteMutation(id);
    } else {
      deleteMutation(groupId);
    }
  };

  const handleEventClick = useCallback((ev: CalendarEvent) => {
    setActiveDialog({ type: 'eventDetails' });
    setCurrentEvent(ev);
  }, []);

  // const selectedEmployee = useMemo(
  //   () => employees.find((emp) => emp.id === currentEvent.employeeId) || null,
  //   [employees, currentEvent.employeeId]
  // );

  if (isErrorEmployees || isErrorVacations) {
    return <Box>{isErrorEmployees ? 'employeesError' : 'vacationsError'}</Box>;
  }

  return (
    <Box sx={{ padding: { xs: 1, sm: 2, md: 3 }, pb: 4 }} className="relative">
      {(isLoadingEmployees || isLoadingVacations) && (
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
            xs: selectDay ? 'flex' : 'none',
            sm: 'none',
          },
        }}
        className="border bg-red-100"
        onClick={() => {
          handleModalClose();
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Header z kontrolkami */}
      <Stack
        alignItems={'center'}
        direction={'row'}
        flexWrap={'wrap'}
        justifyContent={'flex-start'}
        gap={2}
        mb={1}
        width={'100%'}
        className={
          'border-lightGray rounded-lg border bg-gray-100/40 px-3 py-3 md:py-2'
        }
      >
        <Badge badgeContent={selectedEmployees.length} color="primary">
          <IconButton
            size="small"
            className="rounded-lg border text-blue-500"
            onClick={() => setIsFilterOpen(true)}
          >
            <FilterListIcon />
          </IconButton>
        </Badge>

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
            onChange={handleDatePickerChange}
          />
        </LocalizationProvider>
        <Stack direction={'row'}>
          <IconButton
            size="small"
            className="rounded-l-lg rounded-r-none border text-blue-600"
            onClick={() => handleMonthChange('prev')}
          >
            <ChevronLeft />
          </IconButton>
          <Button
            variant="outlined"
            className="rounded-none border-x-0 border-blue-600 text-blue-600"
            onClick={() => handleMonthChange('today')}
          >
            Dziś
          </Button>
          <IconButton
            size="small"
            className="rounded-l-none rounded-r-lg border text-blue-600"
            onClick={() => handleMonthChange('next')}
          >
            <ChevronRight />
          </IconButton>
        </Stack>

        <Stack
          sx={{ flexGrow: 1 }}
          alignItems={'center'}
          direction={'row'}
          flexWrap={'wrap'}
          justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
        >
          <Typography
            variant="h6"
            component="h1"
            fontWeight={'medium'}
            textTransform={'capitalize'}
            className="border-dark rounded-lg border bg-white px-3 py-1"
          >
            {currentMonth.format('MMMM YYYY')}
          </Typography>
        </Stack>
      </Stack>

      {/* Kalendarz */}
      <Box
        sx={{ overflow: 'hidden', userSelect: 'none', position: 'relative' }}
        className="rounded-lg border border-gray-300"
      >
        <CalendarGrid
          monthGrid={monthGrid}
          currentMonth={currentMonth}
          selectDay={selectDay}
          onDayClick={handleDayClick}
          isDayInRange={isDayInRange}
          handleEventClick={handleEventClick}
          setActiveDialog={setActiveDialog}
        />
      </Box>

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
            // minHeight: 130,
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

      {/* Dialog dodawania/edycji urlopu */}
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
          {/* {activeDialog.type === 'eventDetails' ? (
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleeventDetails()}
              >
                Usuń
              </Button>
            ) : (
            
            )} */}
          <Button variant="contained" onClick={() => handleAddEvent()}>
            Zapisz
          </Button>
        </DialogActions>
      </Dialog>
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
                      activeDialog.type === 'moreEvents' &&
                      activeDialog.day.date.isBetween(
                        e.startDate,
                        e.endDate,
                        'day',
                        '[]'
                      ) &&
                      (selectedEmployees.length === 0 ||
                        selectedEmployees.some(
                          (emp) => emp.id === e.employee.id
                        ))
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
                      // onClick={() => handleEventClick(event)}
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
                        // onClick={() => handleMonthChange('prev')}
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
                    // onClick={() => handleEventClick(event)}
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

          {/* <Button onClick={handleModalClose}>Zamknij</Button> */}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default React.memo(Calendar);
