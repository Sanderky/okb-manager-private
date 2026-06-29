import { useState, useMemo, useCallback, useEffect } from 'react';
import { useConstructions, type Construction } from '@/entities/construction';
import { useEmployees, type Employee } from '@/entities/employee';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import type { WorkHours } from '../types';
import { getStartOfWeek, getWeekDates } from '@/shared/lib/date';
import {
  buildGroupedConstructionView,
  calculateTotalHours,
  formatWorkLogsForTable,
} from '../utils/hoursTableUtils';
import { useHoursTableActions } from './useHoursTableActions';
import { useUnsavedChangesWarning } from '@/shared/lib/useUnsavedChangesWarning';
import { useSavedFilters } from './useSavedFilters';
import { useWorkLogs } from '../api/useWorkLogs';
import { useEmployeeVacations } from '@/entities/vacations';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

export const useHoursTable = (startWeek?: Date) => {
  const { filters, updateFilter } = useSavedFilters();

  const [isExpanded, setIsExpanded] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<Date>(
    startWeek ?? getStartOfWeek(new Date())
  );

  const [localWorkHours, setLocalWorkHours] = useState<WorkHours[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedConstructionForEmployee, setSelectedConstructionForEmployee] =
    useState<Construction | null>(null);

  useUnsavedChangesWarning(hasUnsavedChanges);

  const {
    employees,
    isLoading: loadingEmployees,
    isError: employeesError,
  } = useEmployees();

  const {
    constructions,
    isLoading: loadingConstructions,
    isError: constructionsError,
  } = useConstructions();

  const {
    workLogs: workLogsRaw = [],
    isLoading: workHoursLoading,
    isError: workHoursError,
  } = useWorkLogs(currentWeek);

  const { isEmployeeOnVacation } = useEmployeeVacations(currentWeek);

  const workHoursFromDB = useMemo(() => {
    return formatWorkLogsForTable(workLogsRaw, currentWeek);
  }, [workLogsRaw, currentWeek]);

  useEffect(() => {
    if (currentWeek.getTime() !== getStartOfWeek(new Date()).getTime()) {
      setEditMode(false);
    }
    setLocalWorkHours([]);
    setHasUnsavedChanges(false);
  }, [currentWeek]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      setLocalWorkHours(workHoursFromDB);
    }
  }, [workHoursFromDB, hasUnsavedChanges]);

  const displayedWorkHours =
    editMode || hasUnsavedChanges ? localWorkHours : workHoursFromDB;

  const selectedConstructions = useMemo(() => {
    return constructions.filter((c) =>
      filters.selectedConstructionIds.includes(c.id)
    );
  }, [constructions, filters.selectedConstructionIds]);

  const selectedEmployees = useMemo(() => {
    return employees.filter((e) => filters.selectedEmployeeIds.includes(e.id));
  }, [employees, filters.selectedEmployeeIds]);

  const totalHoursData = useMemo(() => {
    return calculateTotalHours(
      displayedWorkHours,
      currentWeek,
      selectedEmployees,
      selectedConstructions,
      isEmployeeOnVacation
    );
  }, [
    displayedWorkHours,
    currentWeek,
    selectedEmployees,
    selectedConstructions,
    isEmployeeOnVacation,
  ]);

  const constructionsWithWorkHours = useMemo(() => {
    return buildGroupedConstructionView(
      displayedWorkHours,
      currentWeek,
      selectedEmployees,
      selectedConstructions,
      isEmployeeOnVacation
    );
  }, [
    displayedWorkHours,
    currentWeek,
    selectedEmployees,
    selectedConstructions,
    isEmployeeOnVacation,
  ]);

  const actions = useHoursTableActions({
    setLocalWorkHours,
    setHasUnsavedChanges,
    setEditMode,
    setCurrentWeek,
    workHoursFromDB,
    currentWeek,
    localWorkHours,
    isEmployeeOnVacation,
    editMode,
    hasUnsavedChanges,
    constructions,
    employees,
  });

  const availableConstructionsOptions = useMemo(() => {
    const usedIds = constructionsWithWorkHours.map((c) => c.id);
    return constructions.filter((c) => !usedIds.includes(c.id));
  }, [constructions, constructionsWithWorkHours]);

  const getAvailableConstructions = useCallback(
    () => availableConstructionsOptions,
    [availableConstructionsOptions]
  );
  const getActiveEmployees = useCallback(
    () => employees.filter((e) => e.status),
    [employees]
  );

  const getAvailableEmployeesForConstruction = useCallback(
    (cId: string | undefined) => {
      if (!employees || !cId) return [];
      const group = constructionsWithWorkHours.find((c) => c.id === cId);
      const usedIds = group ? group.workHours.map((w) => w.employeeId) : [];
      return employees.filter((e) => e.status && !usedIds.includes(e.id));
    },
    [employees, constructionsWithWorkHours]
  );

  return {
    isLoading: loadingEmployees || loadingConstructions || workHoursLoading,
    loadingError: workHoursError || employeesError || constructionsError,

    totalHoursData,
    constructionsWithWorkHours,
    weekDates: getWeekDates(currentWeek),

    editMode,
    isExpanded,
    hasUnsavedChanges,
    currentWeek,
    selectedConstructionForEmployee,

    selectedConstructions,
    selectedEmployees,
    employees,
    constructions,
    showInactiveConstructions: filters.showInactiveConstructions,
    showInactiveEmployees: filters.showInactiveEmployees,

    setShowInactiveConstructions: (val: boolean) =>
      updateFilter('showInactiveConstructions', val),
    setShowInactiveEmployees: (val: boolean) =>
      updateFilter('showInactiveEmployees', val),
    onSelectedConstructionsChange: (items: Construction[]) =>
      updateFilter(
        'selectedConstructionIds',
        items.map((c) => c.id)
      ),
    onSelectedEmployeesChange: (items: Employee[]) =>
      updateFilter(
        'selectedEmployeeIds',
        items.map((e) => e.id)
      ),
    onSelectedConstructionForEmployeeChange: (id: string) =>
      setSelectedConstructionForEmployee(
        constructions?.find((c) => c.id === id) || null
      ),
    handleToggleExpand: () => setIsExpanded((prev) => !prev),
    getAvailableEmployeesForConstruction,
    getAvailableConstructions,
    getActiveEmployees,

    ...actions,
  };
};
