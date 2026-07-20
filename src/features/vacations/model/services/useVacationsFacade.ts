import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { useSearchParams } from 'react-router-dom';
import { useCalendarGrid } from '@/shared/lib/calendar/useCalendarGrid';
import useLoading from '@/shared/lib/useLoading';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import { useDialogs } from '@/shared/ui/dialogs/useDialogs';
import { useEmployees } from '@/entities/employee';
import {
  useAddVacation,
  useDeleteVacation,
  useUpdateVacation,
  useVacations,
} from '@/entities/vacations';
import type { CalendarEvent } from '../types';
import { validateVacation } from '../../lib/validation';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'calendar_filters';

export const useVacationsFacade = () => {
  const { t } = useTranslation(['vacations', 'common']);

  const [searchParams, setSearchParams] = useSearchParams();
  const notifications = useNotifications();
  const dialogs = useDialogs();

  const [eventClickSearchParams, setEventClickSearchParams] =
    useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(
    dayjs().startOf('month')
  );
  const [selectDay, setSelectDay] = useState<Dayjs | null>(null);
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent>(
    {} as CalendarEvent
  );

  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isVacationReportOpen, setIsVacationReportOpen] =
    useState<boolean>(false);
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

  const [showInactive, setShowInactive] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved).showInactive ?? false) : true;
  });

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(
    () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved).selectedEmployeeIds ?? []) : [];
    }
  );

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ showInactive, selectedEmployeeIds })
    );
  }, [showInactive, selectedEmployeeIds]);

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
    data: vacations,
    isLoading: isLoadingVacations,
    isError: isErrorVacations,
  } = useVacations(monthKeys);

  const addMutation = useAddVacation();
  const updateMutation = useUpdateVacation();
  const deleteMutation = useDeleteVacation();

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

  const handleEditDialogClose = useCallback(() => {
    setEditDialogOpen(false);
    resetOnClose();
  }, [resetOnClose]);

  const handleDayClick = useCallback(
    (day: Dayjs) => {
      if (!selectDay) {
        setSelectDay(day);
        setCurrentEvent((prev) => ({ ...prev, startDate: day, endDate: day }));
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
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set('month', dayjs(ev.startDate).format('YYYY-MM'));
        newParams.append('vacationId', ev.id);
        return newParams;
      });
      setEventClickSearchParams(true);
    }
  };

  const handleOnAddEventButtonClick = useCallback(() => {
    setSelectDay(dayjs());
    setCurrentEvent((prev) => ({
      ...prev,
      startDate: dayjs(),
      endDate: dayjs(),
    }));
    setAddDialogOpen(true);
  }, []);

  const handleAddEvent = async (eventData: CalendarEvent) => {
    const { employeeId, startDate, endDate, description, color } = eventData;

    const validation = validateVacation(
      employeeId,
      startDate,
      endDate,
      vacations,
      color,
      t
    );

    if (!validation.isValid) {
      setValidationError(
        validation.error || t('vacations:validation.defaultError')
      );
      return;
    }

    try {
      startLoading();
      await addMutation.mutateAsync({
        employeeId: employeeId,
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
        description,
        color,
      });
      notifications.show(t('vacations:notifications.vacationAdded'), {
        severity: 'success',
      });
      handleAddDialogClose();
    } catch {
      notifications.show(t('common:errors.save'), { severity: 'error' });
    } finally {
      stopLoading();
    }
  };

  const handleEditEvent = async (eventData: CalendarEvent) => {
    if (!eventData.id) return;

    const { employeeId, startDate, endDate, description, color } = eventData;
    const otherVacations = vacations.filter((v) => v.id !== currentEvent.id);

    const validation = validateVacation(
      employeeId,
      startDate,
      endDate,
      otherVacations,
      color,
      t
    );

    if (!validation.isValid) {
      setValidationError(
        validation.error || t('vacations:validation.defaultError')
      );
      return;
    }

    try {
      startLoading();
      await updateMutation.mutateAsync({
        id: eventData.id,
        data: {
          employeeId: employeeId,
          startDate: startDate.toDate(),
          endDate: endDate.toDate(),
          description,
          color,
        },
      });
      notifications.show(t('vacations:notifications.vacationUpdated'), {
        severity: 'success',
      });
      setEditDialogOpen(false);
      resetOnClose();
    } catch {
      notifications.show(t('common:errors.edit'), { severity: 'error' });
    } finally {
      stopLoading();
    }
  };

  const handleDeleteEvent = async () => {
    if (!currentEvent.id) return;
    if (
      await dialogs.confirm(t('vacations:dialogs.deleteVacation.description'), {
        severity: 'error',
        okText: t('common:buttons.delete'),
        cancelText: t('common:buttons.cancel'),
        title: t('vacations:dialogs.deleteVacation.title'),
      })
    ) {
      try {
        startLoading();
        await deleteMutation.mutateAsync(currentEvent.id);
        notifications.show(t('vacations:notifications.vacationDeleted'), {
          severity: 'info',
        });
        setEditDialogOpen(false);
        resetOnClose();
      } catch {
        notifications.show(t('common:errors.delete'), { severity: 'error' });
      } finally {
        stopLoading();
      }
    }
  };

  const visibleVacations = useMemo(() => {
    let filtered = vacations.map((ev) => ({
      ...ev,
      id: ev.id!,
      startDate: dayjs(ev.startDate),
      endDate: dayjs(ev.endDate),
      employeeName: ev.employeeName ?? t('vacations:unknownEmployee'),
      employeeActive: ev.employeeActive ?? false,
    }));
    if (selectedEmployeeIds.length > 0) {
      filtered = filtered.filter((v) =>
        selectedEmployeeIds.includes(v.employeeId)
      );
    }
    return filtered;
  }, [vacations, selectedEmployeeIds, t]);

  const monthGrid = useCalendarGrid(currentMonth, visibleVacations);

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
    const vacationId = searchParams.get('vacationId');

    if (vacationId && visibleVacations.length > 0 && !isLoadingVacations) {
      const foundVacation = visibleVacations.find((v) => v.id === vacationId);

      if (foundVacation) {
        setCurrentEvent(foundVacation as CalendarEvent);
        setEditDialogOpen(true);
      }
    }
  }, [searchParams, visibleVacations, isLoadingVacations]);

  return {
    state: {
      currentMonth,
      selectDay,
      currentEvent,
      monthGrid,
      employees,
      vacations,
      filters: { showInactive, selectedEmployeeIds },
      dialogs: {
        isFilterOpen,
        isVacationReportOpen,
        eventsDialogOpen,
        addDialogOpen,
        editDialogOpen,
      },
      validationError,
      activeDayDate,
      status: {
        loading: isLoadingEmployees || isLoadingVacations,
        actionLoading,
        error: isErrorEmployees || isErrorVacations,
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
        setShowInactive,
        setSelectedEmployeeIds,
        setIsFilterOpen,
        setIsVacationReportOpen,
        setEventsDialogOpen,
        setActiveDayDate,
        setValidationError,
      },
      mutations: { handleAddEvent, handleEditEvent, handleDeleteEvent },
      closeDialogs: { add: handleAddDialogClose, edit: handleEditDialogClose },
    },
  };
};

export type VacationsFacadeType = ReturnType<typeof useVacationsFacade>;
