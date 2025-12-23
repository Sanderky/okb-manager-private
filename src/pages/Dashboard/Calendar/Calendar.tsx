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
import { getEmployeeList } from '../../../services/employees';
import { getConstructionList } from '../../../services/constructions';
import {
  createCalendarEvent,
  getCalendarEventsForMonths,
  removeCalendarEvent,
  updateCalendarEvent,
} from '../../../services/calendar';

import type { InfoEvent } from '../../../types';
import { Add, Close } from '@mui/icons-material';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { CalendarGrid } from './CalendarGrid';
import { CalendarControls } from './CalendarControls';
import {
  AddEventDialog,
  EditEventDialog,
  EventListDialog,
} from './CalendarDialogs';
import {
  validateCalendarEvent,
  type CalendarDay,
  type CalendarEvent,
  WEEK_DAYS,
} from './CalendarHelpers';
import PageContainer from '../../../components/PageContainer';
import useLoading from '../../../hooks/useLoading';
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

  const [selectDay, setSelectDay] = useState<Dayjs | null>(null);
  const [activeDayDate, setActiveDayDate] = useState<Dayjs | null>(null);
  const [eventsDialogOpen, setEventsDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [currentEvent, setCurrentEvent] = useState<Partial<CalendarEvent>>({});
  const [validationError, setValidationError] = useState<string>('');

  const notifications = useNotifications();
  const dialogs = useDialogs();
  const queryClient = useQueryClient();

  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  useEffect(() => {
    const monthFromUrl = searchParams.get('month');
    if (monthFromUrl) {
      setCurrentMonth(dayjs(monthFromUrl).startOf('month'));
    }
  }, [searchParams]);

  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
    isError: isErrorEmployees,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
  });

  const {
    data: constructions = [],
    isLoading: isLoadingConstructions,
    isError: isErrorConstructions,
  } = useQuery({
    queryKey: ['constructions'],
    queryFn: () => getConstructionList(),
  });

  const monthKeys = useMemo(() => {
    return [
      currentMonth.subtract(1, 'month').format('YYYY-MM'),
      currentMonth.format('YYYY-MM'),
      currentMonth.add(1, 'month').format('YYYY-MM'),
    ];
  }, [currentMonth]);

  const {
    data: events = [],
    isLoading: isLoadingEvents,
    isError: isErrorEvents,
  } = useQuery<InfoEvent[], Error>({
    queryKey: ['calendarEvents', monthKeys],
    queryFn: () => getCalendarEventsForMonths(monthKeys),
  });

  const { mutate: addMutation } = useMutation({
    mutationFn: createCalendarEvent,
    onMutate: startActionLoading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      notifications.show('Wydarzenie dodane.', { severity: 'success' });
      handleAddDialogClose();
    },
    onError: () => notifications.show('Błąd zapisu.', { severity: 'error' }),
    onSettled: stopActionLoading,
  });

  const { mutate: updateMutation } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InfoEvent> }) =>
      updateCalendarEvent(id, data),
    onMutate: startActionLoading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      notifications.show('Wydarzenie zaktualizowane.', { severity: 'success' });
      handleEditDialogClose();
    },
    onError: () => notifications.show('Błąd edycji.', { severity: 'error' }),
    onSettled: stopActionLoading,
  });

  const { mutate: deleteMutation } = useMutation({
    mutationFn: removeCalendarEvent,
    onMutate: startActionLoading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      notifications.show('Wydarzenie usunięte.', { severity: 'info' });
      handleEditDialogClose();
    },
    onError: () => notifications.show('Błąd usuwania.', { severity: 'error' }),
    onSettled: stopActionLoading,
  });

  const generateMonthGrid = useCallback(
    (month: Dayjs) => {
      const start = month.startOf('month').startOf('week');
      const end = month.endOf('month').endOf('week');
      const weeks: CalendarDay[][] = [];
      let current = start.clone();

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
          const dbEventsForDay = events.filter((ev) => {
            const vStart = dayjs(ev.startDate).startOf('day');
            const vEnd = dayjs(ev.endDate).endOf('day');
            const today = current.startOf('day');
            return today.isSameOrAfter(vStart) && today.isSameOrBefore(vEnd);
          });

          const uiEvents: CalendarEvent[] = dbEventsForDay.map((ev) => ({
            id: ev.id,
            title: ev.title,
            groupId: ev.groupId,
            date: current.clone(),
            startDate: dayjs(ev.startDate),
            endDate: dayjs(ev.endDate),
            severity: ev.severity,
            description: ev.description,
            employeeIds: ev.employeeIds || [],
            constructionIds: ev.constructionIds || [],
          }));

          uiEvents.sort((a, b) => {
            const durA = a.endDate.diff(a.startDate, 'day');
            const durB = b.endDate.diff(b.startDate, 'day');
            return durB - durA;
          });

          uiEvents.forEach((ev) => {
            const id = ev.id!;

            if (groupSlotMap[id] === undefined) {
              const free = getFreeSlot();
              groupSlotMap[id] = free;
              activeSlots[free] = id;
            }
          });

          week.push({
            date: current.clone(),
            events: uiEvents,
            slots: { ...groupSlotMap },
          });

          uiEvents.forEach((ev) => {
            if (current.isSame(ev.endDate, 'day')) {
              const id = ev.id!;
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
    [events]
  );

  const monthGrid = useMemo(
    () => generateMonthGrid(currentMonth),
    [currentMonth, generateMonthGrid]
  );

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
        setCurrentEvent({
          startDate: day,
          endDate: day,
          severity: 'info',
          employeeIds: [],
          constructionIds: [],
        });
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

  const handleEventClick = (ev: CalendarEvent) => {
    setCurrentEvent({ ...ev });
    setEditDialogOpen(true);
  };

  const resetOnClose = useCallback(() => {
    setCurrentEvent({});
    setSelectDay(null);
    setValidationError('');
  }, []);

  const handleAddDialogClose = useCallback(() => {
    setAddDialogOpen(false);
    resetOnClose();
  }, []);

  const handleEventsDialogClose = useCallback(() => {
    setEventsDialogOpen(false);
  }, []);

  const handleEditDialogClose = useCallback(() => {
    setEditDialogOpen(false);
    resetOnClose();
  }, []);

  const handleAddEvent = () => {
    const { startDate, endDate, severity, title } = currentEvent;

    const validation = validateCalendarEvent(
      title!,
      startDate!,
      endDate!,
      severity || ''
    );
    if (!validation.isValid) {
      setValidationError(validation.error || 'Błąd');
      return;
    }

    const payload: Partial<InfoEvent> = {
      title: currentEvent.title,
      description: currentEvent.description,
      severity: currentEvent.severity,
      startDate: startDate!.toDate(),
      endDate: endDate!.toDate(),
      employeeIds: currentEvent.employeeIds,
      constructionIds: currentEvent.constructionIds,
      groupId: currentEvent.groupId,
    };

    addMutation(payload);
  };

  const handleEditEvent = (eventData: Partial<CalendarEvent>) => {
    if (!eventData.id) return;

    const {
      startDate,
      endDate,
      title,
      description,
      severity,
      employeeIds,
      constructionIds,
    } = eventData;

    const validation = validateCalendarEvent(
      title!,
      startDate!,
      endDate!,
      severity || ''
    );
    if (!validation.isValid) {
      setValidationError(validation.error || 'Błąd');
      return;
    }

    const payload: Partial<InfoEvent> = {
      title: title,
      description: description,
      severity: severity,
      startDate: startDate!.toDate(),
      endDate: endDate!.toDate(),
      employeeIds: employeeIds,
      constructionIds: constructionIds,
    };

    updateMutation({ id: eventData.id, data: payload });
  };

  const handleDeleteEvent = async () => {
    if (!currentEvent.id) return;
    if (
      await dialogs.confirm('Czy na pewno chcesz usunąć to wydarzenie?', {
        severity: 'error',
        okText: 'Usuń',
        cancelText: 'Anuluj',
        title: 'Usuwanie wydarzenia',
      })
    ) {
      deleteMutation(currentEvent.id);
    }
  };

  const handleOnAddEventButtonClick = useCallback((date?: Dayjs) => {
    setSelectDay(dayjs());
    setCurrentEvent({
      startDate: date ?? dayjs(),
      endDate: date ?? dayjs(),
      severity: 'info',
      employeeIds: [],
      constructionIds: [],
    });
    setAddDialogOpen(true);
  }, []);

  const handleOnMoreClick = (data: CalendarDay) => {
    setActiveDayDate(data.date);
    setEventsDialogOpen(true);
  };

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

  const loading =
    isLoadingEmployees || isLoadingConstructions || isLoadingEvents;
  const error = isErrorEmployees || isErrorConstructions || isErrorEvents;

  if (error) return <Alert severity="error">Błąd danych</Alert>;

  return (
    <PageContainer
      fixedHeight={true}
      breadcrumbs={[{ title: 'Kalendarz' }]}
      actions={[
        <Button
          key="add"
          variant="contained"
          startIcon={<Add />}
          disabled={loading}
          size="small"
          onClick={() => handleOnAddEventButtonClick()}
        >
          Dodaj wydarzenie
        </Button>,
      ]}
    >
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {loading && (
          <CircularProgress
            sx={{ position: 'absolute', top: '50%', left: '50%' }}
          />
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
          <Close />
        </IconButton>

        <CalendarControls
          currentMonth={currentMonth}
          handleMonthChange={(a) =>
            setCurrentMonth((prev) =>
              a === 'today'
                ? dayjs().startOf('month')
                : a === 'prev'
                  ? prev.subtract(1, 'month')
                  : prev.add(1, 'month')
            )
          }
          handleDatePickerChange={(v) => v && setCurrentMonth(v)}
          containerWidth={width}
        />

        <Box
          sx={(theme) => ({
            borderBottom: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Grid container>
            {WEEK_DAYS.map((d, i) => (
              <Grid
                size={{ xs: 12 / 7 }}
                key={i}
                sx={{ textAlign: 'center', p: 1 }}
              >
                <Typography variant="caption" fontWeight="bold">
                  {d}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <CalendarGrid
            onMoreClick={handleOnMoreClick}
            monthGrid={monthGrid}
            currentMonth={currentMonth}
            selectDay={selectDay}
            onDayClick={handleDayClick}
            isDayInRange={isDayInRange}
            handleEventClick={handleEventClick}
          />
        </Box>

        <AddEventDialog
          open={addDialogOpen}
          currentEvent={currentEvent}
          setCurrentEvent={setCurrentEvent}
          validationError={validationError}
          employees={employees}
          constructions={constructions}
          handleModalClose={handleAddDialogClose}
          handleAddEvent={handleAddEvent}
          loading={actionLoading}
        />
        <EditEventDialog
          handleResetError={() => setValidationError('')}
          open={editDialogOpen}
          currentEvent={currentEvent}
          setCurrentEvent={setCurrentEvent}
          validationError={validationError}
          employees={employees}
          constructions={constructions}
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
      </Box>
    </PageContainer>
  );
};

export default Calendar;
