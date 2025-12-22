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
import {
  createVacation,
  getVacationListForMonths,
  removeVacation,
  updateVacation,
} from '../../../services/vacations';
import type { Employee, Vacation } from '../../../types';
import { Add, Close as CloseIcon } from '@mui/icons-material';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { CalendarGrid } from './CalendarGrid';
import { CalendarControls } from './CalendarControls';
import {
  FilterDialog,
  AddEventDialog,
  EventListDialog,
  EditEventDialog,
  VacationReportDialog,
} from './CalendarDialogs';
import {
  validateVacation,
  type ActiveDialog,
  type CalendarDay,
  type CalendarEvent,
  employeeColors,
  WEEK_DAYS,
} from './CalendarHelpers';
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
  const [searchParams] = useSearchParams();

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
          console.log('Loading saved filters error');
        }
      }
      return [];
    }
  );

  const [selectDay, setSelectDay] = useState<Dayjs | null>(null);

  const [activeDialog, setActiveDialog] = useState<ActiveDialog>({
    type: 'none',
  });

  const [dialogHistory, setDialogHistory] = useState<ActiveDialog[]>([]);

  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isVacationReportOpen, setIsVacationReportOpen] =
    useState<boolean>(false);

  const [currentEvent, setCurrentEvent] = useState<CalendarEvent>(
    {} as CalendarEvent
  );
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
      handleModalClose();
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
      handleModalClose();
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
      handleModalClose();
    },
    onError: (err) => {
      console.error(err);
      notifications.show('Błąd usuwania.', { severity: 'error' });
    },
    onSettled: () => stopActionLoading(),
  });

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
            const simpleEmployee: Employee = {
              id: ev.employeeId,
              name: ev.employeeName || 'Nieznany pracownik',
              status: ev.employeeActive ?? true,
              isContractor: false,
              pesel: null,
              address: null,
              hourRate: null,
              email: null,
              phone: null,
              birthPlace: null,
              accountNumber: null,
              contractStartDate: null,
              contractEndDate: null,
              contractIsPermanent: null,
              a1StartDate: null,
              a1EndDate: null,
              note: null,
              birthDate: null,
            };

            return {
              ...ev,
              startDate: dayjs(ev.startDate),
              endDate: dayjs(ev.endDate),
              date: current.clone(),
              employee: simpleEmployee,
              groupId: ev.id,
            };
          });

          dayEvents.sort((a, b) => {
            const durA = a.endDate.diff(a.startDate, 'day');
            const durB = b.endDate.diff(b.startDate, 'day');
            return durB - durA;
          });

          dayEvents.forEach((ev) => {
            const gid = ev.groupId!;
            if (groupSlotMap[gid] === undefined) {
              const free = getFreeSlot();
              groupSlotMap[gid] = free;
              activeSlots[free] = gid;
            }
          });

          week.push({
            date: current.clone(),
            events: dayEvents,
            slots: { ...groupSlotMap },
          });

          dayEvents.forEach((ev) => {
            if (current.isSame(ev.endDate, 'day')) {
              const gid = ev.groupId!;
              const slot = groupSlotMap[gid];
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
        handleModalClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleMonthChange = useCallback((action: 'prev' | 'next' | 'today') => {
    setCurrentMonth((prev) => {
      if (action === 'prev') return prev.subtract(1, 'month');
      if (action === 'next') return prev.add(1, 'month');
      return dayjs().startOf('month');
    });
  }, []);

  const handleDatePickerChange = useCallback((value: Dayjs | null) => {
    if (value) setCurrentMonth(value);
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
        setActiveDialog({ type: 'addEvent' });
      }
    },
    [selectDay]
  );

  const handleModalClose = useCallback(() => {
    setActiveDialog({ type: 'none' });
    setDialogHistory([]);
    setCurrentEvent({} as CalendarEvent);
    setSelectDay(null);
    setValidationError('');
  }, []);

  const handleBack = useCallback(() => {
    setDialogHistory((prev) => {
      const newHistory = [...prev];
      const previousDialog = newHistory.pop();

      if (previousDialog) {
        setActiveDialog(previousDialog);
      } else {
        setActiveDialog({ type: 'none' });
      }
      return newHistory;
    });
  }, []);

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

  const handleEmployeeChange = useCallback((newValue: Employee) => {
    setCurrentEvent((prev) => ({
      ...prev,
      employee: newValue,
    }));
    setValidationError('');
  }, []);

  const handleAddEvent = () => {
    if (!currentEvent.employee) return;

    const { employee, startDate, endDate, description, color } = currentEvent;

    const validation = validateVacation(
      employee.id,
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
      employeeId: employee.id,
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      description,
      color,
    });
  };

  const handleEditEvent = () => {
    if (!currentEvent.groupId) return;

    const { employee, startDate, endDate, description, color } = currentEvent;

    const otherVacations = vacations.filter(
      (v) => v.id !== currentEvent.groupId
    );
    const validation = validateVacation(
      employee.id,
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
      id: currentEvent.groupId,
      data: {
        employeeId: employee.id,
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
        description,
        color,
      },
    });
  };

  const handleDeleteEvent = async (id?: string) => {
    const targetId = id || currentEvent.groupId;
    if (!targetId) return;

    const confirmed = await dialogs.confirm(
      'Czy na pewno chcesz usunąć ten urlop?',
      {
        title: 'Usuwanie',
        severity: 'error',
        okText: 'Usuń',
        cancelText: 'Anuluj',
      }
    );

    if (confirmed) {
      deleteMutation(targetId);
    }
  };

  const handleEventClick = useCallback(
    (ev: CalendarEvent) => {
      if (activeDialog.type !== 'none') {
        setDialogHistory((prev) => [...prev, activeDialog]);
      }

      setCurrentEvent(ev);
      setActiveDialog({ type: 'editEvent' });
    },
    [activeDialog]
  );

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
          onClick={() => setActiveDialog({ type: 'addEvent' })}
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
          showFilterBadge={selectedEmployeeIds.length > 0}
          setIsFilterOpen={setIsFilterOpen}
          handleMonthChange={handleMonthChange}
          handleDatePickerChange={handleDatePickerChange}
          containerWidth={width}
        />

        <Box
          sx={(theme) => ({
            flexDirection: 'column',
            minHeight: 0,
            borderBottom: `1px solid ${theme.palette.divider}`
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
            setActiveDialog={setActiveDialog}
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

        <AddEventDialog
          activeDialog={activeDialog}
          currentEvent={currentEvent}
          setCurrentEvent={setCurrentEvent}
          validationError={validationError}
          employees={employees}
          handleModalClose={handleModalClose}
          handleEmployeeChange={handleEmployeeChange}
          handleAddEvent={handleAddEvent}
          loading={actionLoading}
        />

        <EditEventDialog
          activeDialog={activeDialog}
          currentEvent={currentEvent}
          setCurrentEvent={setCurrentEvent}
          validationError={validationError}
          employees={employees}
          handleModalClose={handleModalClose}
          handleEmployeeChange={handleEmployeeChange}
          handleDeleteEvent={handleDeleteEvent}
          handleEditEvent={handleEditEvent}
          loading={actionLoading}
          onBack={handleBack}
          canGoBack={dialogHistory.length > 0}
        />

        <EventListDialog
          activeDialog={activeDialog}
          handleModalClose={handleModalClose}
          setActiveDialog={setActiveDialog}
          loading={actionLoading}
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
