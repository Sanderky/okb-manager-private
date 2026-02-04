import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeeList } from '../../../api/employees';
import {
  createVacation,
  getVacationListForMonths,
  removeVacation,
  updateVacation,
} from '../../../api/vacations';
import type { Employee, Vacation } from '../../../types';
import { Add, Close as CloseIcon } from '@mui/icons-material';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { CalendarGrid } from './VacationsGrid';
import { CalendarControls } from './VacationsControls';
import {
  FilterDialog,
  AddVacationDialog,
  EventListDialog,
  EditVacationDialog,
  VacationReportDialog,
} from './VacationsDialogs';
import {
  validateVacation,
  type CalendarDay,
  type CalendarEvent,
  WEEK_DAYS,
} from './VacationsHelpers';
import PageContainer from '../../../components/PageContainer';
import useLoading from '../../../hooks/useLoading';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useSearchParams } from 'react-router-dom';
import useContainerBreakpoint from '../../../hooks/useContainerWidth';
import { useDialogs } from '../../../hooks/useDialogs/useDialogs';

dayjs.locale('pl');

const STORAGE_KEY = 'calendar_filters';

interface StoredFilters {
  showInactive: boolean;
  selectedEmployeeIds: string[];
}

const Calendar: React.FC = () => {
  const [containerRef, width] = useContainerBreakpoint();
  const [searchParams, setSearchParams] = useSearchParams();

  const [eventClickSearchParams, setEventClickSearchParams] =
    useState<boolean>(false);

  const [currentMonth, setCurrentMonth] = useState<Dayjs>(
    dayjs().startOf('month')
  );

  const [showInactive, setShowInactive] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).showInactive ?? false;
      } catch {
        console.error('Loading saved filters error');
      }
    }
    return true;
  });

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(
    () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved).selectedEmployeeIds ?? [];
        } catch {
          console.error('Loading saved filters error');
        }
      }
      return [];
    }
  );

  const [selectDay, setSelectDay] = useState<Dayjs | null>(null);
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent>(
    {} as CalendarEvent
  );

  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isVacationReportOpen, setIsVacationReportOpen] =
    useState<boolean>(false);

  const [activeDayDate, setActiveDayDate] = useState<Dayjs | null>(null);
  const [eventsDialogOpen, setEventsDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const notifications = useNotifications();
  const dialogs = useDialogs();
  const queryClient = useQueryClient();

  const changeMonth = useCallback(
    (newMonth: Dayjs) => {
      searchParams.set('month', newMonth.format('YYYY-MM'));
      setSearchParams(searchParams);
      setEventClickSearchParams(false);
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    if (!searchParams.has('month')) {
      const now = dayjs().format('YYYY-MM');
      setSearchParams(
        (prev) => {
          prev.set('month', now);
          return prev;
        },
        { replace: true }
      );
    }
  }, []);

  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  useEffect(() => {
    const monthFromUrl = searchParams.get('month');

    if (monthFromUrl && !eventClickSearchParams) {
      const month = dayjs(monthFromUrl).startOf('month');
      setCurrentMonth(month);
    }
  }, [searchParams]);

  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
    isError: isErrorEmployees,
  } = useQuery<Employee[], Error>({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
  });

  useEffect(() => {
    const dataToSave: StoredFilters = {
      showInactive,
      selectedEmployeeIds: selectedEmployeeIds,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [showInactive, selectedEmployeeIds]);

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

  const { mutate: addMutation } = useMutation({
    mutationFn: (payload: Partial<Vacation>) => createVacation(payload),
    onMutate: () => startActionLoading(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });

      notifications.show('Urlop został pomyślnie utworzony.', {
        severity: 'success',
      });
      handleAddDialogClose();
    },
    onError: (err) => {
      console.error(err);
      notifications.show('Wystąpił błąd podczas tworzenia urlopu.', {
        severity: 'error',
      });
    },
    onSettled: () => stopActionLoading(),
  });

  const { mutate: updateMutation } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vacation> }) =>
      updateVacation(id, data),
    onMutate: () => startActionLoading(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });
      notifications.show('Urlop został zaktualizowany.', {
        severity: 'success',
      });
      setEditDialogOpen(false);
    },
    onError: (err) => {
      console.error(err);
      notifications.show('Błąd aktualizacji.', { severity: 'error' });
    },
    onSettled: () => stopActionLoading(),
  });

  const { mutate: deleteMutation } = useMutation({
    mutationFn: (id: string) => removeVacation(id),
    onMutate: () => startActionLoading(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });
      notifications.show('Urlop usunięty.', { severity: 'info' });
      setEditDialogOpen(false);
    },
    onError: (err) => {
      console.error(err);
      notifications.show('Błąd usuwania.', { severity: 'error' });
    },
    onSettled: () => stopActionLoading(),
  });

  useEffect(() => {
    const vacationId = searchParams.get('vacationId');

    if (vacationId && vacations.length > 0 && !isLoadingVacations) {
      const foundVacation = vacations.find((v) => v.id === vacationId);

      if (foundVacation) {
        const eventToOpen: CalendarEvent = {
          id: foundVacation.id,
          date: dayjs(foundVacation.startDate),
          employeeId: foundVacation.employeeId,
          employeeName: foundVacation.employeeName ?? 'Nieznany pracownik',
          employeeActive: foundVacation.employeeActive ?? false,
          startDate: dayjs(foundVacation.startDate),
          endDate: dayjs(foundVacation.endDate),
          color: foundVacation.color,
          description: foundVacation.description,
        };

        setCurrentEvent(eventToOpen);
        setEditDialogOpen(true);
      }
    }
  }, [searchParams, vacations, isLoadingVacations]);

  const generateMonthGrid = useCallback(
    (month: Dayjs) => {
      const start = month.startOf('month').startOf('week');
      const end = month.endOf('month').endOf('week');
      const weeks: CalendarDay[][] = [];
      let current = start.clone();

      const visibleVacations =
        selectedEmployeeIds.length > 0
          ? vacations.filter((v) => selectedEmployeeIds.includes(v.employeeId))
          : vacations;

      const groupSlotMap: Record<string, number> = {};
      const activeSlots: Record<number, string> = {};

      const getFreeSlot = (): number => {
        let slot = 0;
        while (activeSlots[slot] !== undefined) slot++;
        return slot;
      };

      while (current.isSameOrBefore(end)) {
        const week: CalendarDay[] = [];

        for (let i = 0; i < 7; i++) {
          const dayEventsRaw = visibleVacations.filter((v) => {
            const vStart = dayjs(v.startDate).startOf('day');
            const vEnd = dayjs(v.endDate).endOf('day');
            const today = current.startOf('day');
            return today.isSameOrAfter(vStart) && today.isSameOrBefore(vEnd);
          });

          const dayEvents: CalendarEvent[] = dayEventsRaw.map((ev) => {
            return {
              ...ev,
              id: ev.id!,
              startDate: dayjs(ev.startDate),
              endDate: dayjs(ev.endDate),
              date: current.clone(),
              employeeId: ev.employeeId,
              employeeName: ev.employeeName ?? 'Nieznany pracownik',
              employeeActive: ev.employeeActive ?? false,
            };
          });

          dayEvents.sort((a, b) => {
            const durA = a.endDate.diff(a.startDate, 'day');
            const durB = b.endDate.diff(b.startDate, 'day');
            return durB - durA;
          });

          dayEvents.forEach((ev) => {
            const id = ev.id;
            if (groupSlotMap[id] === undefined) {
              const free = getFreeSlot();
              groupSlotMap[id] = free;
              activeSlots[free] = id;
            }
          });

          week.push({
            date: current.clone(),
            events: dayEvents,
            slots: { ...groupSlotMap },
          });

          dayEvents.forEach((ev) => {
            if (current.isSame(ev.endDate, 'day')) {
              const id = ev.id;
              const slot = groupSlotMap[id];
              if (slot !== undefined) {
                delete activeSlots[slot];
              }
            }
          });

          current = current.add(1, 'day');
        }
        weeks.push(week);
      }
      return weeks;
    },
    [vacations, selectedEmployeeIds]
  );

  const monthGrid = useMemo(
    () => generateMonthGrid(currentMonth),
    [currentMonth, generateMonthGrid]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetOnClose();
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
        }));
      } else {
        const start = selectDay.isBefore(day) ? selectDay : day;
        const end = selectDay.isBefore(day) ? day : selectDay;
        setCurrentEvent((prev) => ({
          ...prev,
          startDate: start,
          endDate: end,
        }));
        setAddDialogOpen(true);
      }
    },
    [selectDay]
  );

  const handleEventClick = (ev?: CalendarEvent) => {
    if (ev) {
      setCurrentEvent({ ...ev });
      setEditDialogOpen(true);
      const startMonth = dayjs(ev.startDate).format('YYYY-MM');

      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set('month', startMonth);
        newParams.append('vacationId', ev.id);
        return newParams;
      });
      setEventClickSearchParams(true);
    }
  };

  const resetOnClose = useCallback(() => {
    setCurrentEvent({} as CalendarEvent);
    setSelectDay(null);
    setValidationError('');
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete('vacationId');
      return newParams;
    });
  }, [setSearchParams]);

  const handleAddDialogClose = useCallback(() => {
    setAddDialogOpen(false);
    resetOnClose();
  }, [resetOnClose]);

  const handleEventsDialogClose = useCallback(() => {
    setEventsDialogOpen(false);
  }, []);

  const handleEditDialogClose = useCallback(() => {
    setEditDialogOpen(false);
    resetOnClose();
  }, [resetOnClose]);

  const handleOnAddEventButtonClick = useCallback((date?: Dayjs) => {
    setSelectDay(dayjs());
    setCurrentEvent((prev) => ({
      ...prev,
      startDate: date ?? dayjs(),
      endDate: date ?? dayjs(),
    }));
    setAddDialogOpen(true);
  }, []);

  const handleOnMoreClick = (data: CalendarDay) => {
    setActiveDayDate(data.date);
    setEventsDialogOpen(true);
  };

  const handleMonthChangeControl = useCallback(
    (action: 'prev' | 'next' | 'today') => {
      let newMonth = currentMonth.clone();

      if (action === 'today') {
        newMonth = dayjs().startOf('month');
      } else if (action === 'prev') {
        newMonth = newMonth.subtract(1, 'month');
      } else if (action === 'next') {
        newMonth = newMonth.add(1, 'month');
      }

      changeMonth(newMonth);
    },
    [currentMonth, changeMonth]
  );

  const handleDatePickerChangeControl = useCallback(
    (newValue: Dayjs | null) => {
      if (newValue) {
        changeMonth(newValue);
      }
    },
    [changeMonth]
  );

  const activeDayData = useMemo(() => {
    if (!activeDayDate) return null;

    for (const week of monthGrid) {
      const foundDay = week.find((day) =>
        day.date.isSame(activeDayDate, 'day')
      );
      if (foundDay) return foundDay;
    }
    return null;
  }, [monthGrid, activeDayDate]);

  const isDayInRange = useCallback(
    (day: Dayjs) => {
      if (!currentEvent.startDate) return false;
      const start = currentEvent.startDate.startOf('day');
      if (!currentEvent.endDate) return day.startOf('day').isSame(start);
      const end = currentEvent.endDate.startOf('day');
      return day.isSameOrAfter(start) && day.isSameOrBefore(end);
    },
    [currentEvent]
  );

  const handleAddEvent = (eventData: CalendarEvent) => {
    const { employeeId, startDate, endDate, description, color } = eventData;

    const validation = validateVacation(
      employeeId,
      startDate,
      endDate,
      vacations,
      color
    );

    if (!validation.isValid) {
      setValidationError(validation.error || 'Błąd walidacji');
      return;
    }

    addMutation({
      employeeId: employeeId,
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      description,
      color,
    });
  };

  const handleEditEvent = (eventData: CalendarEvent) => {
    if (!eventData.id) return;

    const { employeeId, startDate, endDate, description, color } = eventData;

    const otherVacations = vacations.filter((v) => v.id !== currentEvent.id);

    const validation = validateVacation(
      employeeId,
      startDate,
      endDate,
      otherVacations,
      color
    );

    if (!validation.isValid) {
      setValidationError(validation.error || 'Błąd walidacji');
      return;
    }

    updateMutation({
      id: eventData.id,
      data: {
        employeeId: employeeId,
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
        description,
        color,
      },
    });
  };

  const handleDeleteEvent = async () => {
    if (!currentEvent.id) return;
    if (
      await dialogs.confirm('Czy na pewno chcesz usunąć ten urlop?', {
        severity: 'error',
        okText: 'Usuń',
        cancelText: 'Anuluj',
        title: 'Usuwanie urlopu',
      })
    ) {
      deleteMutation(currentEvent.id);
    }
  };

  const error = isErrorEmployees || isErrorVacations;
  const loading = isLoadingEmployees || isLoadingVacations;

  if (error) {
    return (
      <PageContainer
        breadcrumbs={[{ title: 'Kalendarz urlopów' }]}
        fixedHeight={true}
      >
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
      fixedHeight={true}
      breadcrumbs={[{ title: 'Kalendarz urlopów' }]}
      actions={[
        <Button
          key="add"
          size="small"
          onClick={() => handleOnAddEventButtonClick()}
          variant="contained"
          startIcon={<Add />}
          disabled={loading || employees.length === 0}
        >
          Dodaj urlop
        </Button>,
        <Button
          key="report"
          size="small"
          onClick={() => setIsVacationReportOpen(true)}
          variant="contained"
          startIcon={<ListAltIcon />}
          disabled={loading || employees.length === 0}
        >
          Wykaz urlopów
        </Button>,
      ]}
    >
      <Box
        className="relative"
        ref={containerRef}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {loading && (
          <Box
            sx={(theme) => ({
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: theme.palette.loadingOverlay,
              zIndex: 100,
              borderRadius: 'inherit',
            })}
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
            resetOnClose();
          }}
        >
          <CloseIcon />
        </IconButton>

        <CalendarControls
          currentMonth={currentMonth}
          showFilterBadge={selectedEmployeeIds.length > 0}
          setIsFilterOpen={setIsFilterOpen}
          handleMonthChange={handleMonthChangeControl}
          handleDatePickerChange={handleDatePickerChangeControl}
          containerWidth={width}
        />

        <Box
          sx={(theme) => ({
            flexDirection: 'column',
            minHeight: 0,
            borderBottom: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Grid container>
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
          </Grid>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            overflowX: 'hidden',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <CalendarGrid
            monthGrid={monthGrid}
            currentMonth={currentMonth}
            selectDay={selectDay}
            onDayClick={handleDayClick}
            isDayInRange={isDayInRange}
            handleEventClick={handleEventClick}
            onMoreClick={handleOnMoreClick}
          />
        </Box>

        <FilterDialog
          showInactive={showInactive}
          setShowInactive={(val) => setShowInactive(val)}
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
          employees={employees}
          selectedEmployees={selectedEmployeeIds}
          setSelectedEmployees={setSelectedEmployeeIds}
        />

        <AddVacationDialog
          open={addDialogOpen}
          currentEvent={currentEvent}
          validationError={validationError}
          employees={employees}
          handleModalClose={handleAddDialogClose}
          handleAddEvent={handleAddEvent}
          loading={actionLoading}
        />
        <EditVacationDialog
          handleResetError={() => setValidationError('')}
          open={editDialogOpen}
          currentEvent={currentEvent}
          validationError={validationError}
          employees={employees}
          handleModalClose={handleEditDialogClose}
          handleDeleteEvent={handleDeleteEvent}
          handleEditEvent={handleEditEvent}
          loading={actionLoading}
        />

        <EventListDialog
          loading={loading}
          onAddButtonClick={handleOnAddEventButtonClick}
          open={eventsDialogOpen}
          onClose={handleEventsDialogClose}
          selectedDayData={activeDayData}
          onEventClick={handleEventClick}
        />

        <VacationReportDialog
          open={isVacationReportOpen}
          onClose={() => setIsVacationReportOpen(false)}
          employees={employees}
          vacations={vacations}
          showInactive={showInactive}
          setShowInactive={(val) => setShowInactive(val)}
        />
      </Box>
    </PageContainer>
  );
};

export default Calendar;
