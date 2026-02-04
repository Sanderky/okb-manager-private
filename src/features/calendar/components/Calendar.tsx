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
import { getConstructionList } from '../../../api/constructions';


import type { CalendarDay, CalendarEvent, EventCategory, InfoEvent } from '../types';
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

import PageContainer from '../../../components/PageContainer';
import useLoading from '../../../hooks/useLoading';
import { useSearchParams } from 'react-router-dom';
import useContainerBreakpoint from '../../../hooks/useContainerWidth';
import { useDialogs } from '../../../hooks/useDialogs/useDialogs';
import { AVAILABLE_CATEGORIES, validateCalendarEvent, WEEK_DAYS } from '../utils';
import { createCalendarEvent, getCalendarEventsForMonths, removeCalendarEvent, updateCalendarEvent } from '../api';

dayjs.locale('pl');

const CALENDAR_FILTERS_STORAGE_KEY = 'calendar_view_filters';

const Calendar: React.FC = () => {
  const [containerRef, width] = useContainerBreakpoint();
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentMonth, setCurrentMonth] = useState<Dayjs>(
    dayjs().startOf('month')
  );

  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>(
    () => {
      try {
        const saved = localStorage.getItem(CALENDAR_FILTERS_STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (error) {
        console.error('Błąd odczytu filtrów kalendarza z localStorage', error);
      }
      return AVAILABLE_CATEGORIES;
    }
  );

  useEffect(() => {
    localStorage.setItem(
      CALENDAR_FILTERS_STORAGE_KEY,
      JSON.stringify(selectedCategories)
    );
  }, [selectedCategories]);

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

  const [selectDay, setSelectDay] = useState<Dayjs | null>(null);
  const [activeDayDate, setActiveDayDate] = useState<Dayjs | null>(null);
  const [eventsDialogOpen, setEventsDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [currentEvent, setCurrentEvent] = useState<Partial<CalendarEvent>>({});
  const [validationError, setValidationError] = useState<string>('');

  const [eventClickSearchParams, setEventClickSearchParams] =
    useState<boolean>(false);

  const changeMonth = useCallback(
    (newMonth: Dayjs) => {
      searchParams.set('month', newMonth.format('YYYY-MM'));
      setSearchParams(searchParams);
      setEventClickSearchParams(false);
    },
    [searchParams, setSearchParams]
  );

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
    if (monthFromUrl && !eventClickSearchParams) {
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
      setEditDialogOpen(false);
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

  useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (eventId && events.length > 0 && !isLoadingEvents) {
      const foundEvent = events.find((e) => e.id === eventId);

      if (foundEvent) {
        const eventToOpen: CalendarEvent = {
          id: foundEvent.id,
          title: foundEvent.title,
          groupId: foundEvent.groupId,
          date: dayjs(foundEvent.startDate),
          startDate: dayjs(foundEvent.startDate),
          endDate: dayjs(foundEvent.endDate),
          description: foundEvent.description,
          employeeIds: foundEvent.employeeIds || [],
          constructionIds: foundEvent.constructionIds || [],
          color: foundEvent.color,
          category: foundEvent.category,
          isAutoGenerated: foundEvent.isAutoGenerated,
        };

        setCurrentEvent(eventToOpen);
        setEditDialogOpen(true);
      }
    }
  }, [searchParams, events, isLoadingEvents]);

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

            const isDateMatch =
              today.isSameOrAfter(vStart) && today.isSameOrBefore(vEnd);
            const isCategoryMatch = selectedCategories.includes(ev.category);

            return isDateMatch && isCategoryMatch;
          });

          const uiEvents: CalendarEvent[] = dbEventsForDay.map((ev) => ({
            id: ev.id,
            title: ev.title,
            groupId: ev.groupId,
            date: current.clone(),
            startDate: dayjs(ev.startDate),
            endDate: dayjs(ev.endDate),
            category: ev.category,
            color: ev.color,
            isAutoGenerated: ev.isAutoGenerated,
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
    [events, selectedCategories]
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
          category: 'info',
          color: 'blue',
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
    const startMonth = dayjs(ev.startDate).format('YYYY-MM');
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('month', startMonth);
      newParams.append('eventId', ev.id ?? '');
      return newParams;
    });
    setEventClickSearchParams(true);
  };

  const resetOnClose = useCallback(() => {
    setCurrentEvent({});
    setSelectDay(null);
    setValidationError('');
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete('eventId');
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

  const handleAddEvent = (eventData: Partial<CalendarEvent>) => {
    const { startDate, endDate, category, title } = eventData;

    const validation = validateCalendarEvent(
      title!,
      startDate!,
      endDate!,
      category || ''
    );
    if (!validation.isValid) {
      setValidationError(validation.error || 'Błąd');
      return;
    }

    const payload: Partial<InfoEvent> = {
      title: eventData.title,
      description: eventData.description,
      category: eventData.category,
      color: eventData.color,
      isAutoGenerated: eventData.isAutoGenerated,
      startDate: startDate!.toDate(),
      endDate: endDate!.toDate(),
      employeeIds: eventData.employeeIds,
      constructionIds: eventData.constructionIds,
      groupId: eventData.groupId,
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
      category,
      color,
      isAutoGenerated,
      employeeIds,
      constructionIds,
    } = eventData;

    const validation = validateCalendarEvent(
      title!,
      startDate!,
      endDate!,
      category || ''
    );
    if (!validation.isValid) {
      setValidationError(validation.error || 'Błąd');
      return;
    }

    const payload: Partial<InfoEvent> = {
      title: title,
      description: description,
      category: category,
      color: color,
      isAutoGenerated: isAutoGenerated,
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
      category: 'info',
      color: 'blue',
      employeeIds: [],
      constructionIds: [],
    });
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

  const loading =
    isLoadingEmployees || isLoadingConstructions || isLoadingEvents;
  const error = isErrorEmployees || isErrorConstructions || isErrorEvents;

  if (error) {
    return (
      <PageContainer breadcrumbs={[{ title: 'Kalendarz' }]} fixedHeight={true}>
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
          <Close />
        </IconButton>

        <CalendarControls
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          currentMonth={currentMonth}
          handleMonthChange={handleMonthChangeControl}
          handleDatePickerChange={handleDatePickerChangeControl}
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
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color="textSecondary"
                >
                  {d}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
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
