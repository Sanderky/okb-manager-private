import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Construction, Employee, WorkHours } from '../../../types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeeList } from '../../../services/employees';
import { getConstructionList } from '../../../services/constructions';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/pl';
import {
  getMonthKeysFromWeek,
  getNextWeek,
  getPreviousWeek,
  getStartOfWeek,
  getWeekDates,
} from './HoursHelpers';
import { getVacationListForMonths } from '../../../services/vacations';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useDialogs } from '../../../hooks/useDialogs/useDialogs';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import {
  getWorkHoursList,
  addWorkHours,
  deleteAllWorkHoursForWeek,
} from '../../../services/hours';
import { getScheduleListForWeek } from '../../../services/schedules';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

export interface ConstructionsWithWorkHours {
  id: string;
  name: string;
  isActive: boolean;
  workHours: {
    id: string;
    employeeId: string;
    employeeName: string;
    isActive: boolean;
    hours: number[];
    total: number;
    isOnVacation: boolean[];
  }[];
  totalHours: number;
}

const useHoursTable = (startWeek?: Date) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<Date>(
    startWeek ?? getStartOfWeek(new Date())
  );

  const [localWorkHours, setLocalWorkHours] = useState<WorkHours[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [selectedConstructions, setSelectedConstructions] = useState<
    Construction[]
  >([]);

  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleNavigation = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');

      if (link && hasUnsavedChanges) {
        const href = link.getAttribute('href');

        if (href && href.startsWith('/') && !href.startsWith('#')) {
          const confirmed = window.confirm(
            'Masz niezapisane zmiany. Czy na pewno chcesz opuścić tę stronę? Wszystkie niezapisane zmiany zostaną utracone.'
          );

          if (!confirmed) {
            event.preventDefault();
            event.stopPropagation();
          }
        }
      }
    };

    document.addEventListener('click', handleNavigation, true);

    return () => {
      document.removeEventListener('click', handleNavigation, true);
    };
  }, [hasUnsavedChanges]);

  const onSelectedConstructionsChange = (constructions: Construction[]) => {
    setSelectedConstructions(constructions);
  };

  const onSelectedEmployeesChange = (employees: Employee[]) => {
    setSelectedEmployees(employees);
  };

  useEffect(() => {
    if (startWeek) setCurrentWeek(startWeek);
  }, [startWeek]);

  const dialogs = useDialogs();
  const notifications = useNotifications();

  useEffect(() => {
    if (currentWeek !== getStartOfWeek(new Date())) setEditMode(false);
  }, [currentWeek]);

  useEffect(() => {
    setLocalWorkHours([]);
    setHasUnsavedChanges(false);
  }, [currentWeek]);

  const [selectedConstructionForEmployee, setSelectedConstructionForEmployee] =
    useState<Construction | null>(null);

  const {
    data: employees,
    isLoading: employeesLoading,
    error: employeesError,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
  });

  const {
    data: constructions,
    isLoading: constructionsLoading,
    error: constructionsError,
  } = useQuery({
    queryKey: ['constructions'],
    queryFn: getConstructionList,
  });

  const {
    data: workHours = [],
    isLoading: workHoursLoading,
    error: workHoursError,
  } = useQuery({
    queryKey: ['workHours', currentWeek.toISOString()],
    queryFn: () => getWorkHoursList(currentWeek),
  });

  useEffect(() => {
    if (!hasUnsavedChanges) {
      setLocalWorkHours(workHours);
    }
  }, [workHours, hasUnsavedChanges]);

  const {
    data: vacations = [],
    isLoading: vacationsLoading,
    error: vacationsError,
  } = useQuery({
    queryKey: ['vacations', currentWeek.toISOString()],
    queryFn: () => getVacationListForMonths(getMonthKeysFromWeek(currentWeek)),
  });

  const vacationMap = useMemo(() => {
    const map = new Map<string, Set<string>>();

    vacations.forEach((vacation) => {
      if (!vacation.employeeId || !vacation.date) return;

      const dateObj = vacation.date;
      const dateString = dayjs(dateObj).format('YYYY-MM-DD');

      if (!map.has(vacation.employeeId)) {
        map.set(vacation.employeeId, new Set());
      }

      const employeeVacationSet = map.get(vacation.employeeId)!;
      employeeVacationSet.add(dateString);
    });

    return map;
  }, [vacations]);

  const queryClient = useQueryClient();

  const saveWorkHoursMutation = useMutation({
    mutationFn: async (workHoursToSave: WorkHours[]) => {
      await deleteAllWorkHoursForWeek(currentWeek);

      if (workHoursToSave.length > 0) {
        const savePromises = workHoursToSave.map((wh) => addWorkHours(wh));
        await Promise.all(savePromises);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workHours', currentWeek.toISOString()],
      });
      setHasUnsavedChanges(false);
      notifications.show('Zmiany zostały zapisane', {
        severity: 'success',
        autoHideDuration: 3000,
      });
    },
    onError: (error: Error) => {
      console.error('Hours Table save error:', error);
      notifications.show('Błąd podczas zapisywania zmian', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    },
  });

  const copyFromPreviousWeekMutation = useMutation({
    mutationFn: async (sourceWeek: Date) => {
      const sourceWorkHours = await getWorkHoursList(sourceWeek);

      const newWorkHours: WorkHours[] = sourceWorkHours
        .map((sourceWh) => {
          const construction = constructions?.find(
            (c) => c.id === sourceWh.constructionId
          );
          const employee = employees?.find((e) => e.id === sourceWh.employeeId);

          if (!construction || !employee) {
            return null;
          }

          return {
            ...sourceWh,
            id: `${sourceWh.constructionId}_${sourceWh.employeeId}_${currentWeek.getTime()}`,
            weekStart: currentWeek,
          };
        })
        .filter(Boolean) as WorkHours[];

      return newWorkHours;
    },
    onSuccess: (newWorkHours) => {
      setLocalWorkHours(newWorkHours);
      setHasUnsavedChanges(true);

      if (newWorkHours.length > 0) {
        notifications.show(
          `Dane zostały skopiowane z wybranego tygodnia. Pamiętaj o zapisaniu zmian.`,
          {
            severity: 'success',
            autoHideDuration: 5000,
          }
        );
      } else {
        notifications.show(`Brak danych do skopiowania z danego tygodnia.`, {
          severity: 'info',
          autoHideDuration: 5000,
        });
      }
    },
    onError: (error: Error) => {
      notifications.show('Błąd podczas kopiowania danych', {
        severity: 'error',
        autoHideDuration: 5000,
      });
      console.error('Data copy error:', error);
    },
  });

  const handleCopyFromSourceWeek = useCallback(
    (sourceWeek: Date) => {
      const hasExistingLocalData = localWorkHours && localWorkHours.length > 0;

      if (hasExistingLocalData) {
        dialogs
          .confirm(
            `Czy na pewno chcesz skopiować dane z wybranego tygodnia? Obecne niezapisane zmiany w tym tygodniu zostaną utracone.`,
            {
              title: `Kopiowanie danych`,
              severity: 'warning',
              okText: 'Kontynuuj',
              cancelText: 'Anuluj',
            }
          )
          .then((confirmed) => {
            if (confirmed) {
              copyFromPreviousWeekMutation.mutate(sourceWeek);
            }
          });
      } else {
        copyFromPreviousWeekMutation.mutate(sourceWeek);
      }
    },
    [copyFromPreviousWeekMutation, localWorkHours, dialogs]
  );

  const fillWithScheduleMutation = useMutation({
    mutationFn: async () => {
      const schedules = await getScheduleListForWeek(currentWeek);
      const newWorkHours: WorkHours[] = [];

      const DEFAULT_HOURS = 10;

      schedules.forEach((schedule) => {
        const { employeeId, constructions: scheduleConstructions } = schedule;

        const employee = employees?.find((e) => e.id === employeeId);
        if (!employee) {
          return;
        }

        const constructionDays = new Map<string, { days: number[] }>();

        scheduleConstructions?.forEach((constructionId, dayIndex) => {
          if (constructionId) {
            const construction = constructions?.find(
              (c) => c.id === constructionId
            );
            if (!construction) {
              return;
            }

            if (!constructionDays.has(constructionId)) {
              constructionDays.set(constructionId, {
                days: [],
              });
            }

            constructionDays.get(constructionId)!.days.push(dayIndex);
          }
        });

        constructionDays.forEach((value, constructionId) => {
          const construction = constructions?.find(
            (c) => c.id === constructionId
          );
          if (!construction) {
            return;
          }

          const hours = Array(7).fill(0);

          value.days.forEach((dayIndex) => {
            hours[dayIndex] = DEFAULT_HOURS;
          });

          const workHoursId = `${constructionId}_${employeeId}_${currentWeek.getTime()}`;
          newWorkHours.push({
            id: workHoursId,
            constructionId,
            employeeId,
            hours,
            weekStart: currentWeek,
          });
        });
      });

      return newWorkHours;
    },
    onSuccess: (newWorkHours) => {
      setLocalWorkHours(newWorkHours);
      setHasUnsavedChanges(true);

      if (newWorkHours.length > 0) {
        notifications.show(
          `Załadowano ${newWorkHours.length} pozycji z harmonogramu do tabeli. Pamiętaj o zapisaniu zmian.`,
          {
            severity: 'success',
            autoHideDuration: 5000,
          }
        );
      } else {
        notifications.show(`Brak danych w harmonogramie na dany tydzień.`, {
          severity: 'info',
          autoHideDuration: 5000,
        });
      }
    },
    onError: (error: Error) => {
      notifications.show('Błąd podczas ładowania danych z harmonogramu', {
        severity: 'error',
        autoHideDuration: 5000,
      });
      console.error('Fill with schedule error:', error);
    },
  });

  const handleFillWithSchedule = useCallback(async () => {
    const hasExistingLocalData = localWorkHours && localWorkHours.length > 0;

    let confirmation = true;
    if (hasExistingLocalData) {
      confirmation = await dialogs.confirm(
        `Czy na pewno chcesz uzupełnić dane z harmonogramu? Obecne niezapisane zmiany w tym tygodniu zostaną utracone.`,
        {
          title: `Uzupełnianie z harmonogramu`,
          severity: 'warning',
          okText: 'Kontynuuj',
          cancelText: 'Anuluj',
        }
      );
    }

    if (confirmation) {
      fillWithScheduleMutation.mutate();
    }
  }, [dialogs, fillWithScheduleMutation, localWorkHours]);

  const onWeeekChange = (weekStart: Date) => {
    if (hasUnsavedChanges) {
      dialogs
        .confirm(
          `Masz niezapisane zmiany. Czy na pewno chcesz zmienić tydzień? Wszystkie niezapisane zmiany zostaną utracone.`,
          {
            title: `Niezapisane zmiany`,
            severity: 'warning',
            okText: 'Tak',
            cancelText: 'Pozostań',
          }
        )
        .then((confirmed) => {
          if (confirmed) {
            setCurrentWeek(weekStart);
            setEditMode(false);
          }
        });
    } else {
      setCurrentWeek(weekStart);
    }
  };

  const onSelectedConstructionForEmployeeChange = (constructionId: string) => {
    const construction = constructions?.find((c) => c.id === constructionId);
    if (construction) setSelectedConstructionForEmployee(construction);
  };

  const handleToggleEditMode = async (editModeVal?: boolean) => {
    if (editModeVal === undefined) {
      if (editMode) {
        if (hasUnsavedChanges) {
          await saveWorkHoursMutation.mutateAsync(localWorkHours);
        }
        setEditMode(false);
      } else {
        setEditMode(true);
      }
    } else {
      if (!editModeVal && hasUnsavedChanges) {
        await saveWorkHoursMutation.mutateAsync(localWorkHours);
      }

      setEditMode(editMode);
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleHoursChange = (
    workHourId: string,
    dayIndex: number,
    value: number | string
  ) => {
    if (!localWorkHours) return;

    const numericValue =
      typeof value === 'string' ? parseFloat(value) || 0 : value;

    setLocalWorkHours((prev) =>
      prev.map((wh) => {
        if (wh.id === workHourId) {
          const newHours = [...wh.hours];
          newHours[dayIndex] = numericValue;

          const weekDates = getWeekDates(currentWeek);
          const newTotal = newHours.reduce((sum, current, index) => {
            const isVacation = isEmployeeOnVacation(
              wh.employeeId,
              weekDates[index]
            );
            return isVacation ? sum : sum + current;
          }, 0);

          return {
            ...wh,
            hours: newHours,
            total: newTotal,
          };
        }
        return wh;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleWeekChange = (week: 'prev' | 'current' | 'next') => {
    if (hasUnsavedChanges) {
      dialogs
        .confirm(
          `Masz niezapisane zmiany. Czy na pewno chcesz zmienić tydzień? Wszystkie niezapisane zmiany zostaną utracone.`,
          {
            title: `Niezapisane zmiany`,
            severity: 'warning',
            okText: 'Tak',
            cancelText: 'Pozostań',
          }
        )
        .then((confirmed) => {
          if (confirmed) {
            performWeekChange(week);
          }
        });
    } else {
      performWeekChange(week);
    }
  };

  const performWeekChange = (week: 'prev' | 'current' | 'next') => {
    switch (week) {
      case 'prev':
        setCurrentWeek(getPreviousWeek(currentWeek));
        setEditMode(false);
        return;
      case 'current':
        setCurrentWeek(getStartOfWeek(new Date()));
        setEditMode(false);
        return;
      case 'next':
        setCurrentWeek(getNextWeek(currentWeek));
        setEditMode(false);
        return;
    }
  };

  const isEmployeeOnVacation = (employeeId: string, date: Date): boolean => {
    const employeeVacations = vacationMap.get(employeeId);
    if (!employeeVacations) {
      return false;
    }
    const dateString = dayjs(date).format('YYYY-MM-DD');
    return employeeVacations.has(dateString);
  };

  const handleDeleteEmployee = async (
    workHoursId: string,
    employeeName: string,
    constructionName: string
  ) => {
    const confirmation = await dialogs.confirm(
      `Czy na pewno chcesz usunąć pracownika ${employeeName} z budowy ${constructionName}?`,
      {
        title: `Usuwanie pracownika`,
        severity: 'error',
        okText: 'Usuń',
        cancelText: 'Anuluj',
      }
    );
    if (confirmation) {
      setLocalWorkHours((prev) => prev.filter((wh) => wh.id !== workHoursId));
      setHasUnsavedChanges(true);
    }
  };

  const handleDeleteConstruction = async (
    constructionId: string,
    constructionName: string
  ) => {
    const confirmation = await dialogs.confirm(
      `Czy na pewno chcesz usunąć budowę ${constructionName} wraz ze wszystkimi pracownikami?`,
      {
        title: `Usuwanie budowy`,
        severity: 'error',
        okText: 'Usuń',
        cancelText: 'Anuluj',
      }
    );
    if (confirmation) {
      setLocalWorkHours((prev) =>
        prev.filter((wh) => wh.constructionId !== constructionId)
      );
      setHasUnsavedChanges(true);
    }
  };

  const handleEmployeesAdded = (newWorkHoursArray: WorkHours[]) => {
    setLocalWorkHours((prev) => [...prev, ...newWorkHoursArray]);
    setHasUnsavedChanges(true);
  };

  const handleConstructionWithEmployeeAdded = (
    newWorkHoursArray: WorkHours[]
  ) => {
    setLocalWorkHours((prev) => [...prev, ...newWorkHoursArray]);
    setHasUnsavedChanges(true);
  };

  const handleCancelEdit = async () => {
    if (hasUnsavedChanges) {
      const confirmed = await dialogs.confirm(
        `Czy na pewno chcesz anulować edycję? Obecne niezapisane zmiany w tym tygodniu zostaną utracone.`,
        {
          title: `Anuluwanie edycji`,
          severity: 'warning',
          okText: 'Kontynuuj',
          cancelText: 'Wróć',
        }
      );
      if (confirmed) {
        setLocalWorkHours(workHours);
        setHasUnsavedChanges(false);
        setEditMode(false);
      }
    } else {
      setLocalWorkHours(workHours);
      setHasUnsavedChanges(false);
      setEditMode(false);
    }
  };

  const displayedWorkHours = editMode ? localWorkHours : workHours;

  const totalHoursData = useMemo(() => {
    if (!displayedWorkHours)
      return { dailyTotals: [0, 0, 0, 0, 0, 0, 0], grandTotal: 0 };

    const selectedEmployeeIds = selectedEmployees.map((emp) => emp.id);
    const selectedConstructionIds = selectedConstructions.map(
      (construction) => construction.id
    );

    const filteredWorkHours = displayedWorkHours.filter((workHour) => {
      const employeeMatch =
        selectedEmployees.length === 0 ||
        selectedEmployeeIds.includes(workHour.employeeId);

      const constructionMatch =
        selectedConstructions.length === 0 ||
        selectedConstructionIds.includes(workHour.constructionId);

      const constructionExists =
        constructions?.some((c) => c.id === workHour.constructionId) ?? true;
      const employeeExists =
        employees?.some((e) => e.id === workHour.employeeId) ?? true;

      return (
        employeeMatch &&
        constructionMatch &&
        constructionExists &&
        employeeExists
      );
    });

    const dailyTotals = [0, 0, 0, 0, 0, 0, 0];
    let grandTotal = 0;
    const weekDates = getWeekDates(currentWeek);

    filteredWorkHours.forEach((workHour) => {
      workHour.hours.forEach((hours, dayIndex) => {
        const parsedHours = Number(hours);
        const numericHours = isNaN(parsedHours) ? 0 : parsedHours;
        const date = weekDates[dayIndex];

        if (!isEmployeeOnVacation(workHour.employeeId, date)) {
          dailyTotals[dayIndex] += numericHours;
          grandTotal += numericHours;
        }
      });
    });

    return { dailyTotals, grandTotal };
  }, [
    displayedWorkHours,
    constructions,
    employees,
    vacations,
    currentWeek,
    selectedEmployees,
    selectedConstructions,
  ]);

  const constructionsWithWorkHours = useMemo(() => {
    if (!displayedWorkHours || !constructions || !employees) return [];

    const constructionMap = new Map<string, ConstructionsWithWorkHours>();
    const weekDates = getWeekDates(currentWeek);

    const selectedEmployeeIds = selectedEmployees.map((emp) => emp.id);
    const selectedConstructionIds = selectedConstructions.map(
      (construction) => construction.id
    );

    displayedWorkHours.forEach((workHour) => {
      if (
        selectedEmployees.length > 0 &&
        !selectedEmployeeIds.includes(workHour.employeeId)
      ) {
        return;
      }

      const construction = constructions.find(
        (c) => c.id === workHour.constructionId
      );
      const employee = employees.find((e) => e.id === workHour.employeeId);

      if (!construction || !employee) {
        return;
      }

      const constructionName = construction.name;
      const employeeName = employee.name;

      if (!constructionMap.has(workHour.constructionId)) {
        constructionMap.set(workHour.constructionId, {
          id: workHour.constructionId,
          name: constructionName,
          isActive: construction.status,
          workHours: [],
          totalHours: 0,
        });
      }

      const constructionData = constructionMap.get(workHour.constructionId)!;

      const numericHours = workHour.hours.map((h) =>
        typeof h === 'string' ? parseFloat(h as string) || 0 : h
      );

      const isOnVacation = weekDates.map((date) =>
        isEmployeeOnVacation(workHour.employeeId, date)
      );

      const employeeTotalHours = numericHours.reduce((sum, current, index) => {
        return isOnVacation[index] ? sum : sum + current;
      }, 0);

      constructionData.workHours.push({
        id: workHour.id,
        employeeId: workHour.employeeId,
        employeeName: employeeName,
        isActive: employee?.status ?? false,
        hours: numericHours,
        total: employeeTotalHours,
        isOnVacation,
      });

      constructionData.totalHours += employeeTotalHours;
    });

    const constructionArray = Array.from(constructionMap.values());

    let filteredConstructions = constructionArray;
    if (selectedConstructions.length > 0) {
      filteredConstructions = constructionArray.filter((construction) =>
        selectedConstructionIds.includes(construction.id)
      );
    }

    return filteredConstructions;
  }, [
    displayedWorkHours,
    constructions,
    employees,
    vacations,
    currentWeek,
    selectedEmployees,
    selectedConstructions,
  ]);

  const getAvailableConstructions = useCallback(() => {
    const existingConstructionIds = constructionsWithWorkHours.map(
      (construction) => construction.id
    );
    return (
      constructions?.filter(
        (construction) =>
          !existingConstructionIds.includes(construction.id) &&
          construction.status
      ) || []
    );
  }, [constructions, constructionsWithWorkHours]);

  const getActiveEmployees = useCallback(() => {
    return employees?.filter((e) => e.status) ?? [];
  }, [employees]);

  const isLoading =
    employeesLoading ||
    constructionsLoading ||
    workHoursLoading ||
    vacationsLoading;
  const loadingError =
    workHoursError || employeesError || vacationsError || constructionsError;

  const weekDates = getWeekDates(currentWeek);

  const getAvailableEmployeesForConstruction = useCallback(
    (constructionId: string | undefined) => {
      if (!employees || !constructionId) return [];

      const constructionWithWorkHours = constructionsWithWorkHours.find(
        (c) => c.id === constructionId
      );

      if (!constructionWithWorkHours) return [];

      const activeEmployees =
        employees?.filter((employee) => employee.status) ?? [];

      const existingEmployeeIds = constructionWithWorkHours.workHours.map(
        (workHour) => workHour.employeeId
      );

      const availableEmployees = activeEmployees.filter(
        (employee) => !existingEmployeeIds.includes(employee.id)
      );

      return availableEmployees;
    },
    [employees, constructionsWithWorkHours]
  );

  return {
    isLoading,
    loadingError,
    totalHoursData,
    handleEmployeesAdded,
    handleDeleteConstruction,
    handleCopyFromSourceWeek,
    handleDeleteEmployee,
    handleHoursChange,
    editMode,
    handleToggleExpand,
    handleConstructionWithEmployeeAdded,
    weekDates,
    selectedConstructionForEmployee,
    currentWeek,
    handleWeekChange,
    handleToggleEditMode,
    onWeeekChange,
    isExpanded,
    isCoping: copyFromPreviousWeekMutation.isPending,
    constructionsWithWorkHours,
    onSelectedConstructionForEmployeeChange,
    onSelectedConstructionsChange,
    selectedConstructions,
    handleFillWithSchedule,
    isFilling: fillWithScheduleMutation.isPending,
    hasUnsavedChanges,
    isSaving: saveWorkHoursMutation.isPending,
    handleCancelEdit,
    selectedEmployees,
    onSelectedEmployeesChange,
    getAvailableEmployeesForConstruction,
    getAvailableConstructions,
    getActiveEmployees,
  };
};

export default useHoursTable;
