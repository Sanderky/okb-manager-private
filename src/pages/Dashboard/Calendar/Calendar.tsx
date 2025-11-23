import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeeList } from '../../../api/employees';
import type { Employee, Vacation } from '../../../types';
import {
  createVacation,
  getVacationListForMonths,
  removeVacation,
  updateVacationGroup,
} from '../../../api/vacations';
import { Close as CloseIcon } from '@mui/icons-material';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { CalendarGrid } from './CalendarGrid';
import { CalendarControls } from './CalendarControls';
import {
  FilterDialog,
  AddEventDialog,
  EventDetailsDialog,
  EditEventDialog,
  VacationReportDialog,
} from './CalendarDialogs';
import {
  validateVacation,
  type ActiveDialog,
  type CalendarDay,
  type CalendarEvent,
  employeeColors,
} from './CalendarHelpers';
import PageContainer from '../../../components/PageContainer';
import useLoading from '../../../hooks/useLoading';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useSearchParams } from 'react-router-dom';
import useContainerBreakpoint from '../../../hooks/useContainerWidth';
import { useDialogs } from '../../../hooks/useDialogs/useDialogs';

dayjs.locale('pl');

const Calendar: React.FC = () => {
  const [containerRef, width] = useContainerBreakpoint();

  const [searchParams] = useSearchParams();
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

  const [isVacationReportOpen, setIsVacationReportOpen] =
    useState<boolean>(false);

  const notifications = useNotifications();
  const dialogs = useDialogs();

  const queryClient = useQueryClient();

  useEffect(() => {
    const monthFromUrl = searchParams.get('month');
    if (monthFromUrl) {
      const month = dayjs(monthFromUrl).startOf('month');
      setCurrentMonth(month);
    }
  }, [searchParams]);

  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
    isError: isErrorEmployees,
  } = useQuery<Employee[], Error>({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
  });

  const monthKeys = useMemo(() => {
    const prevMonth = currentMonth.subtract(1, 'month');
    const nextMonth = currentMonth.add(1, 'month');

    return [
      prevMonth.format('YYYY-MM'),
      currentMonth.format('YYYY-MM'),
      nextMonth.format('YYYY-MM'),
    ];
  }, [currentMonth]);

  const {
    data: vacations = [],
    isLoading: isLoadingVacations,
    isError: isErrorVacations,
  } = useQuery<Vacation[], Error>({
    queryKey: ['vacations', monthKeys],
    queryFn: () => getVacationListForMonths(monthKeys),
  });

  const { mutate: addMutation, isPending: isAdding } = useMutation({
    mutationFn: (payload: Vacation[]) => createVacation(payload),
    onMutate: () => {
      startActionLoading();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      notifications.show('Urlop został pomyślnie utworzony.', {
        severity: 'success',
        autoHideDuration: 5000,
      });
      handleModalClose();
    },
    onError: (err: Error) => {
      console.error('Create vacation error:', err);
      notifications.show('Wystąpił błąd podczas tworzenia urlopu.', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    },
    onSettled: () => {
      stopActionLoading();
    },
  });

  const { mutate: updateMutation, isPending: isUpdating } = useMutation({
    mutationFn: ({
      groupId,
      data,
    }: {
      groupId: string;
      data: Partial<Vacation>;
    }) => updateVacationGroup(groupId, data),
    onMutate: () => {
      startActionLoading();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      notifications.show('Urlop został pomyślnie zaktualizowany.', {
        severity: 'success',
        autoHideDuration: 5000,
      });
      handleModalClose();
    },
    onError: (err: Error) => {
      console.error('Update vacation error:', err);
      notifications.show('Wystąpił błąd podczas aktualizacji urlopu.', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    },
    onSettled: () => {
      stopActionLoading();
    },
  });

  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => removeVacation(id),
    onMutate: () => {
      startActionLoading();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      notifications.show('Urlop został pomyślnie usunięty.', {
        severity: 'info',
        autoHideDuration: 5000,
      });
      handleModalClose();
    },
    onError: (err: Error) => {
      console.error('Delete vacation error:', err);
      notifications.show('Wystąpił błąd podczas usuwania urlopu.', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    },
    onSettled: () => {
      stopActionLoading();
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
            current.isSame(dayjs(event.date), 'day')
          );

          const newDayEvents: CalendarEvent[] = filteredDayEvents
            .map(({ employeeId, ...ev }) => {
              const employee = employees.find((e) => e.id === employeeId);
              if (!employee) return null;

              return {
                ...ev,
                endDate: dayjs(ev.endDate),
                startDate: dayjs(ev.startDate),
                date: dayjs(ev.date),
                employee: employee,
                description: ev.description,
                color: ev.color,
              };
            })
            .filter(Boolean) as CalendarEvent[];

          const sortedDayEvents = newDayEvents.sort((a, b) => {
            const durationA = a.endDate.diff(a.startDate, 'day');
            const durationB = b.endDate.diff(b.startDate, 'day');
            return durationB - durationA;
          });

          sortedDayEvents.forEach((ev) => {
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

          sortedDayEvents.forEach((ev) => {
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
          endDate: day,
          color: employeeColors[0],
        }));
      } else {
        const start = selectDay.isBefore(day) ? selectDay : day;
        const end = selectDay.isBefore(day) ? day : selectDay;
        setCurrentEvent((prev) => ({
          ...prev,
          startDate: start,
          endDate: end,
          color: prev.color || employeeColors[0],
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

    const { employee, startDate, endDate, description, color } = currentEvent;

    const validation = validateVacation(
      employee?.id || '',
      startDate,
      endDate,
      vacations,
      color
    );

    if (!validation.isValid) {
      setValidationError(validation.error || 'Wystąpił błąd walidacji');
      return;
    }

    const groupId = `${employee.id}${dayjs().unix()}`;

    let currentDate = dayjs(startDate);

    const eventList: Vacation[] = [];

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
      eventList.push({
        employeeId: employee.id,
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
        groupId: groupId,
        date: currentDate.toDate(),
        yearMonth: currentDate.format('YYYY-MM'),
        description: description,
        color: color,
      });
      currentDate = currentDate.add(1, 'day');
    }

    addMutation(eventList);
  };

  const handleEditEvent = () => {
    if (!currentEvent.groupId) return;

    const { employee, startDate, endDate, description, color } = currentEvent;

    const otherVacations = vacations.filter(
      (v) => v.groupId !== currentEvent.groupId
    );

    const validation = validateVacation(
      employee?.id || '',
      startDate,
      endDate,
      otherVacations,
      color
    );

    if (!validation.isValid) {
      setValidationError(validation.error || 'Wystąpił błąd walidacji');
      return;
    }

    const updateData: Partial<Vacation> = {
      employeeId: employee.id,
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      description: description,
      color: color,
    };

    updateMutation({ groupId: currentEvent.groupId, data: updateData });
  };

  const handleDeleteEvent = async (id?: string) => {
    const { groupId } = currentEvent;

    if (!groupId && !id) return;

    const confirmation = await dialogs.confirm(
      `Czy na pewno chcesz usunąć urlop?`,
      {
        title: `Usuwanie urlopu`,
        severity: 'error',
        okText: 'Usuń',
        cancelText: 'Anuluj',
      }
    );
    if (confirmation) {
      if (id) {
        deleteMutation(id);
      } else {
        deleteMutation(groupId);
      }
    }
  };

  const handleEventClick = useCallback((ev: CalendarEvent) => {
    setActiveDialog({ type: 'eventDetails' });
    setCurrentEvent(ev);
  }, []);

  const error = isErrorEmployees || isErrorVacations;
  const loading = isLoadingEmployees || isLoadingVacations;

  if (error) {
    return (
      <PageContainer breadcrumbs={[{ title: 'Kalendarz urlopów' }]}>
        <Box className="relative">
          <Alert severity="error">
            Wystąpił błąd podczas ładowania danych.
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      breadcrumbs={[{ title: 'Kalendarz urlopów' }]}
      actions={
        <Button
          size="small"
          onClick={() => setIsVacationReportOpen(true)}
          variant="contained"
          startIcon={<ListAltIcon />}
        >
          Wykaz urlopów
        </Button>
      }
    >
      <Box className="relative" ref={containerRef}>
        {loading && (
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

        <CalendarControls
          currentMonth={currentMonth}
          selectedEmployees={selectedEmployees}
          setIsFilterOpen={setIsFilterOpen}
          handleMonthChange={handleMonthChange}
          handleDatePickerChange={handleDatePickerChange}
          containerWidth={width}
        />

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

        <FilterDialog
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
          employees={employees}
          selectedEmployees={selectedEmployees}
          setSelectedEmployees={setSelectedEmployees}
        />

        <AddEventDialog
          activeDialog={activeDialog}
          currentEvent={currentEvent}
          setCurrentEvent={setCurrentEvent}
          validationError={validationError}
          employees={employees}
          handleModalClose={handleModalClose}
          handleEmployeeChange={handleEmployeeChange}
          handleAddEvent={handleAddEvent}
          loading={actionLoading || isAdding}
        />

        <EditEventDialog
          activeDialog={activeDialog}
          currentEvent={currentEvent}
          setCurrentEvent={setCurrentEvent}
          validationError={validationError}
          employees={employees}
          handleModalClose={handleModalClose}
          handleEmployeeChange={handleEmployeeChange}
          handleEditEvent={handleEditEvent}
          loading={actionLoading || isUpdating}
        />

        <EventDetailsDialog
          activeDialog={activeDialog}
          currentEvent={currentEvent}
          selectedEmployees={selectedEmployees}
          handleModalClose={handleModalClose}
          handleDeleteEvent={handleDeleteEvent}
          setActiveDialog={setActiveDialog}
          loading={actionLoading || isDeleting}
          onEventClick={handleEventClick}
        />

        <VacationReportDialog
          open={isVacationReportOpen}
          onClose={() => setIsVacationReportOpen(false)}
          employees={employees}
          vacations={vacations}
        />
      </Box>
    </PageContainer>
  );
};

export default Calendar;
