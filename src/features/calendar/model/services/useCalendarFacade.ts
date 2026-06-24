import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { useSearchParams } from 'react-router-dom';
import { useCalendarGrid } from '@/shared/lib/calendar/useCalendarGrid';
import useLoading from '@/shared/lib/useLoading';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import { useDialogs } from '@/shared/ui/dialogs/useDialogs';
import { useEmployees } from '@/entities/employee';
import { useConstructions } from '@/entities/construction';
import {
  EVENT_CATEGORIES,
  useAddEvent,
  useDeleteEvent,
  useEvents,
  useUpdateEvent,
  type EventCategory,
} from '@/entities/events';
import type { UiCalendarEvent } from '../types';
import { validateCalendarEvent } from '../validation';

const CALENDAR_FILTERS_STORAGE_KEY = 'calendar_view_filters';

export const useCalendarFacade = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const notifications = useNotifications();
  const dialogs = useDialogs();

  const [eventClickSearchParams, setEventClickSearchParams] =
    useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(
    dayjs().startOf('month')
  );
  const [selectDay, setSelectDay] = useState<Dayjs | null>(null);
  const [currentEvent, setCurrentEvent] = useState<Partial<UiCalendarEvent>>(
    {}
  );

  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [eventsDialogOpen, setEventsDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeDayDate, setActiveDayDate] = useState<Dayjs | null>(null);
  const [validationError, setValidationError] = useState<string>('');

  const {
    loading: actionLoading,
    startLoading,
    stopLoading,
  } = useLoading(false);

  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>(
    () => {
      try {
        const saved = localStorage.getItem(CALENDAR_FILTERS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (error) {
        console.error('Błąd odczytu filtrów', error);
      }
      return EVENT_CATEGORIES;
    }
  );

  useEffect(() => {
    localStorage.setItem(
      CALENDAR_FILTERS_STORAGE_KEY,
      JSON.stringify(selectedCategories)
    );
  }, [selectedCategories]);

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
      changeMonth(dayjs().startOf('month'));
    } else if (!eventClickSearchParams) {
      setCurrentMonth(dayjs(searchParams.get('month')).startOf('month'));
    }
  }, [searchParams, eventClickSearchParams, changeMonth]);

  const monthKeys = useMemo(
    () => [
      currentMonth.subtract(1, 'month').format('YYYY-MM'),
      currentMonth.format('YYYY-MM'),
      currentMonth.add(1, 'month').format('YYYY-MM'),
    ],
    [currentMonth]
  );

  const {
    employees,
    isLoading: isLoadingEmployees,
    isError: isErrorEmployees,
  } = useEmployees();

  const {
    constructions,
    isLoading: isLoadingConstructions,
    isError: isErrorConstructions,
  } = useConstructions();

  const {
    events,
    isLoading: isLoadingEvents,
    isError: isErrorEvents,
  } = useEvents(monthKeys);

  const addMutation = useAddEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

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
  const handleEditDialogClose = useCallback(() => {
    setEditDialogOpen(false);
    resetOnClose();
  }, [resetOnClose]);

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

  const handleEventClick = (ev: UiCalendarEvent) => {
    setCurrentEvent({ ...ev });
    setEditDialogOpen(true);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('month', dayjs(ev.startDate).format('YYYY-MM'));
      newParams.append('eventId', ev.id ?? '');
      return newParams;
    });
    setEventClickSearchParams(true);
  };

  const handleAddEvent = async (eventData: Partial<UiCalendarEvent>) => {
    const { startDate, endDate, category, title } = eventData;

    const start = dayjs(startDate);
    const end = dayjs(endDate);

    const validation = validateCalendarEvent(
      title!,
      start,
      end,
      category || ''
    );
    if (!validation.isValid)
      return setValidationError(validation.error || 'Błąd');

    try {
      startLoading();
      await addMutation.mutateAsync({
        title: eventData.title,
        description: eventData.description,
        category: eventData.category,
        color: eventData.color,
        isAutoGenerated: eventData.isAutoGenerated,
        startDate: start.toDate(),
        endDate: end.toDate(),
        employeeIds: eventData.employeeIds,
        constructionIds: eventData.constructionIds,
        groupId: eventData.groupId,
      });
      notifications.show('Wydarzenie dodane.', { severity: 'success' });
      handleAddDialogClose();
    } catch {
      notifications.show('Błąd zapisu.', { severity: 'error' });
    } finally {
      stopLoading();
    }
  };

  const handleEditEvent = async (eventData: Partial<UiCalendarEvent>) => {
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

    const start = dayjs(startDate);
    const end = dayjs(endDate);

    const validation = validateCalendarEvent(
      title!,
      start,
      end,
      category || ''
    );
    if (!validation.isValid)
      return setValidationError(validation.error || 'Błąd');

    try {
      startLoading();
      await updateMutation.mutateAsync({
        id: eventData.id,
        data: {
          title,
          description,
          category,
          color,
          isAutoGenerated,
          startDate: start.toDate(),
          endDate: end.toDate(),
          employeeIds,
          constructionIds,
        },
      });
      notifications.show('Wydarzenie zaktualizowane.', { severity: 'success' });
      setEditDialogOpen(false);
      resetOnClose();
    } catch {
      notifications.show('Błąd edycji.', { severity: 'error' });
    } finally {
      stopLoading();
    }
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
      try {
        startLoading();
        await deleteMutation.mutateAsync(currentEvent.id);
        notifications.show('Wydarzenie usunięte.', { severity: 'info' });
        setEditDialogOpen(false);
        resetOnClose();
      } catch {
        notifications.show('Błąd usuwania.', { severity: 'error' });
      } finally {
        stopLoading();
      }
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

  const visibleEvents = useMemo(() => {
    return events
      .filter((ev) => selectedCategories.includes(ev.category))
      .map(
        (ev): UiCalendarEvent => ({
          id: ev.id,
          title: ev.title,
          groupId: ev.groupId,
          startDate: dayjs(ev.startDate),
          endDate: dayjs(ev.endDate),
          category: ev.category,
          color: ev.color,
          isAutoGenerated: ev.isAutoGenerated,
          description: ev.description,
          employeeIds: ev.employeeIds || [],
          constructionIds: ev.constructionIds || [],
        })
      );
  }, [events, selectedCategories]);

  const monthGrid = useCalendarGrid(currentMonth, visibleEvents);

  const isDayInRange = useCallback(
    (day: Dayjs) => {
      if (!currentEvent.startDate) return false;

      const start = dayjs(currentEvent.startDate).startOf('day');

      if (!currentEvent.endDate) return day.startOf('day').isSame(start);

      const end = dayjs(currentEvent.endDate).startOf('day');

      return day.isSameOrAfter(start) && day.isSameOrBefore(end);
    },
    [currentEvent]
  );

  useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (eventId && events.length > 0 && !isLoadingEvents) {
      const foundEvent = visibleEvents.find((e) => e.id === eventId);
      if (foundEvent) {
        setCurrentEvent(foundEvent);
        setEditDialogOpen(true);
      }
    }
  }, [searchParams, visibleEvents, isLoadingEvents]);

  return {
    state: {
      currentMonth,
      selectDay,
      currentEvent,
      monthGrid,
      employees,
      constructions,
      filters: { selectedCategories },
      dialogs: {
        isFilterOpen,
        eventsDialogOpen,
        addDialogOpen,
        editDialogOpen,
      },
      validationError,
      activeDayDate,
      status: {
        loading:
          isLoadingEmployees || isLoadingConstructions || isLoadingEvents,
        actionLoading,
        error: isErrorEmployees || isErrorConstructions || isErrorEvents,
      },
    },
    actions: {
      changeMonth,
      handleDayClick,
      handleEventClick,
      handleOnAddEventButtonClick,
      resetOnClose,
      isDayInRange,
      setters: {
        setSelectedCategories,
        setIsFilterOpen,
        setEventsDialogOpen,
        setActiveDayDate,
        setValidationError,
        setCurrentEvent,
      },
      mutations: { handleAddEvent, handleEditEvent, handleDeleteEvent },
      closeDialogs: { add: handleAddDialogClose, edit: handleEditDialogClose },
    },
  };
};

export type CalendarFacadeType = ReturnType<typeof useCalendarFacade>;
