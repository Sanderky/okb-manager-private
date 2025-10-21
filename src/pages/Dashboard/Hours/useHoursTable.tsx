import { useState, useMemo, useCallback, useEffect } from 'react';
import type { WorkHours } from '../../../types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeeList } from '../../../api/employees';
import { getConstructionList } from '../../../api/constructions';
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
import { getVacationListForMonths } from '../../../api/vacations';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useDialogs } from '../../../hooks/useDialogs/useDialogs';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import {
  getWorkHoursList,
  updateWorkHours,
  deleteWorkHours,
  deleteConstructionWorkHours,
  copyFromPreviousWeek,
} from '../../../api/hours';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

export interface ConstructionsWithWorkHours {
  id: string;
  name: string;
  workHours: {
    id: string;
    employeeId: string;
    employeeName: string;
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

  useEffect(() => {
    if (startWeek) setCurrentWeek(startWeek);
  }, [startWeek]);

  const dialogs = useDialogs();
  const notifications = useNotifications();

  useEffect(() => {
    if (currentWeek !== getStartOfWeek(new Date())) setEditMode(false);
  }, [currentWeek]);

  const [selectedConstructionForEmployee, setSelectedConstructionForEmployee] =
    useState<string>('');

  const {
    data: employees,
    isLoading: employeesLoading,
    error: employeesError,
  } = useQuery({
    queryKey: ['employees', false],
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
    data: workHours,
    isLoading: workHoursLoading,
    error: workHoursError,
  } = useQuery({
    queryKey: ['workHours', currentWeek.toISOString()],
    queryFn: () => getWorkHoursList(currentWeek),
  });

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

      const dateObj = vacation.date.toDate();
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

  const updateWorkHoursMutation = useMutation({
    mutationFn: updateWorkHours,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workHours', currentWeek.toISOString()],
      });
    },
  });

  const deleteWorkHoursMutation = useMutation({
    mutationFn: deleteWorkHours,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workHours', currentWeek.toISOString()],
      });
    },
  });

  const deleteConstructionMutation = useMutation({
    mutationFn: (constructionId: string) =>
      deleteConstructionWorkHours(constructionId, currentWeek),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workHours', currentWeek.toISOString()],
      });
    },
  });

  const copyFromPreviousWeekMutation = useMutation({
    mutationFn: (sourceWeek: Date) =>
      copyFromPreviousWeek(currentWeek, sourceWeek),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workHours', currentWeek.toISOString()],
      });
      notifications.show('Dane zostały skopiowane z wybranego tygodnia', {
        severity: 'success',
        autoHideDuration: 5000,
      });
    },
    onError: (error: Error) => {
      notifications.show('Błąd podczas kopiowania danych', {
        severity: 'error',
        autoHideDuration: 5000,
      });
      console.error('Data copy error:', error);
    },
  });

  const onWeeekChange = (weekStart: Date) => {
    setCurrentWeek(weekStart);
  };

  const onSelectedConstructionForEmployeeChange = (constructionId: string) => {
    setSelectedConstructionForEmployee(constructionId);
  };

  const handleToggleEditMode = (editMode?: boolean) => {
    if (editMode === undefined) {
      setEditMode((prev) => !prev);
      return;
    }

    return editMode ? setEditMode(true) : setEditMode(false);
  };

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleHoursChange = (
    workHourId: string,
    dayIndex: number,
    value: number | string
  ) => {
    if (!workHours) return;

    const existingRecord = workHours.find((wh) => wh.id === workHourId);
    if (!existingRecord) return;

    const newHours = [...existingRecord.hours];

    const numericValue =
      typeof value === 'string' ? parseFloat(value) || 0 : value;
    newHours[dayIndex] = numericValue;

    const updatedWorkHours: WorkHours = {
      ...existingRecord,
      hours: newHours,
    };

    updateWorkHoursMutation.mutate(updatedWorkHours);
  };

  const handleWeekChange = (week: 'prev' | 'current' | 'next') => {
    switch (week) {
      case 'prev':
        setCurrentWeek(getPreviousWeek(currentWeek));
        return;
      case 'current':
        setCurrentWeek(getStartOfWeek(new Date()));
        return;
      case 'next':
        setCurrentWeek(getNextWeek(currentWeek));
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

  const handleDeleteEmployee = async (workHoursId: string) => {
    const confirmation = await dialogs.confirm(
      `Czy na pewno chcesz usunąć tego pracownika z budowy?`,
      {
        title: `Usuwanie pracownika`,
        severity: 'error',
        okText: 'Usuń',
        cancelText: 'Anuluj',
      }
    );
    if (confirmation) {
      deleteWorkHoursMutation.mutate(workHoursId);
    }
  };

  const handleDeleteConstruction = async (constructionId: string) => {
    const confirmation = await dialogs.confirm(
      `Czy na pewno chcesz usunąć tę budowę wraz ze wszystkimi pracownikami?`,
      {
        title: `Usuwanie budowy`,
        severity: 'error',
        okText: 'Usuń',
        cancelText: 'Anuluj',
      }
    );
    if (confirmation) {
      deleteConstructionMutation.mutate(constructionId);
    }
  };

  const handleConstructionWithEmployeeAdded = () => {};

  const handleEmployeeAdded = () => {};

  const handleCopyFromSourceWeek = useCallback(
    (sourceWeek: Date) => {
      copyFromPreviousWeekMutation.mutate(sourceWeek);
    },
    [copyFromPreviousWeekMutation]
  );

  const totalHoursData = useMemo(() => {
    if (!workHours)
      return { dailyTotals: [0, 0, 0, 0, 0, 0, 0], grandTotal: 0 };

    const dailyTotals = [0, 0, 0, 0, 0, 0, 0];
    let grandTotal = 0;
    const weekDates = getWeekDates(currentWeek);

    workHours.forEach((workHour) => {
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
  }, [workHours, vacations, currentWeek]);

  const constructionsWithWorkHours = useMemo(() => {
    if (!workHours || !constructions || !employees) return [];

    const constructionMap = new Map<string, ConstructionsWithWorkHours>();

    const weekDates = getWeekDates(currentWeek);

    workHours.forEach((workHour) => {
      const construction = constructions.find(
        (c) => c.id === workHour.constructionId
      );
      const employee = employees.find((e) => e.id === workHour.employeeId);

      if (construction && employee) {
        if (!constructionMap.has(construction.id)) {
          constructionMap.set(construction.id, {
            id: construction.id,
            name: construction.name,
            workHours: [],
            totalHours: 0,
          });
        }

        const constructionData = constructionMap.get(construction.id)!;

        const numericHours = workHour.hours.map((h) =>
          typeof h === 'string' ? parseFloat(h as string) || 0 : h
        );

        const isOnVacation = weekDates.map((date) =>
          isEmployeeOnVacation(workHour.employeeId, date)
        );

        const employeeTotalHours = numericHours.reduce(
          (sum, current, index) => {
            return isOnVacation[index] ? sum : sum + current;
          },
          0
        );

        constructionData.workHours.push({
          id: workHour.id,
          employeeId: workHour.employeeId,
          employeeName: employee.name,
          hours: numericHours,
          total: employeeTotalHours,
          isOnVacation,
        });

        constructionData.totalHours += employeeTotalHours;
      }
    });

    return Array.from(constructionMap.values());
  }, [workHours, constructions, employees, vacations, currentWeek]);

  const existingConstructionIds = useMemo(() => {
    return constructionsWithWorkHours.map((construction) => construction.id);
  }, [constructionsWithWorkHours]);

  const getExistingEmployeeIdsForConstruction = useMemo(() => {
    const constructionMap = new Map<string, string[]>();

    constructionsWithWorkHours.forEach((construction) => {
      const employeeIds = construction.workHours.map(
        (workHour) => workHour.employeeId
      );
      constructionMap.set(construction.id, employeeIds);
    });

    return (constructionId: string) => {
      return constructionMap.get(constructionId) || [];
    };
  }, [constructionsWithWorkHours]);

  const isLoading =
    employeesLoading ||
    constructionsLoading ||
    workHoursLoading ||
    vacationsLoading;
  const loadingError =
    workHoursError || employeesError || vacationsError || constructionsError;

  const weekDates = getWeekDates(currentWeek);

  return {
    isLoading,
    loadingError,
    getExistingEmployeeIdsForConstruction,
    existingConstructionIds,
    totalHoursData,
    handleEmployeeAdded,
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
    employees,
    constructions,
    constructionsWithWorkHours,
    onSelectedConstructionForEmployeeChange,
  };
};

export default useHoursTable;
