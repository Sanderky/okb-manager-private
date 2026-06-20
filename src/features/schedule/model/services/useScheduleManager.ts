import { useMemo, useState, useCallback, useRef } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useEmployees } from '@/entities/employee';
import { useConstructions, type Construction } from '@/entities/construction';
import { useSchedule } from '@/entities/shedule';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import { useScheduleFilters } from './useScheduleFilters';
import {
  generateWeeks,
  filterEmployeesList,
  getCellKey,
  getCellDisplayData,
  createScheduleMap,
  buildScheduleEntriesToSave,
} from '../utils/scheduleUtils';
import { useEmployeeVacations } from '@/entities/vacations';
import type { ICell } from '../types';
import { useReactToPrint } from 'react-to-print';
import { useUpdateScheduleMutation } from '../api/mutations/updateScheduleMutation';

export const useScheduleManager = () => {
  const notifications = useNotifications();

  const filters = useScheduleFilters();
  const [activeTable, setActiveTable] = useState<{ type: number; week: Dayjs }>(
    {
      type: 0,
      week: dayjs().startOf('week'),
    }
  );
  const [showVacations, setShowVacations] = useState(true);
  const [showDates, setShowDates] = useState(true);
  const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set());

  const printRef = useRef<HTMLDivElement>(null);

  const scheduleDateRange = useMemo(
    () => ({
      start: dayjs(filters.fromWeek).startOf('week').toDate(),
      end: dayjs(filters.toWeek).endOf('week').toDate(),
    }),
    [filters.fromWeek, filters.toWeek]
  );

  const weeks = useMemo(
    () => generateWeeks(filters.fromWeek, filters.toWeek),
    [filters.fromWeek, filters.toWeek]
  );

  const {
    employees,
    isLoading: isEmpLoading,
    isError: isEmpError,
  } = useEmployees();
  const {
    constructions,
    isLoading: isConstLoading,
    isError: isConstError,
  } = useConstructions();
  const {
    schedule,
    isLoading: isSchedLoading,
    isError: isSchedError,
  } = useSchedule(scheduleDateRange.start, scheduleDateRange.end);

  const { isEmployeeOnVacation, vacationsLoading, vacationsError } =
    useEmployeeVacations(filters.fromWeek);

  const scheduleMap = useMemo(() => createScheduleMap(schedule), [schedule]);

  const filteredEmployees = useMemo(
    () =>
      filterEmployeesList(
        employees,
        filters.selectedEmployees,
        filters.showInactive,
        filters.selectedConstructions,
        schedule
      ),
    [
      employees,
      filters.selectedEmployees,
      filters.showInactive,
      filters.selectedConstructions,
      schedule,
    ]
  );

  const employeesCount = useMemo(() => {
    if (filters.showInactive) return employees.length;
    return employees.filter((emp) => emp.status).length;
  }, [employees, filters.showInactive]);

  const updateScheduleMutation = useUpdateScheduleMutation();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Harmonogram',
  });

  const handleCellChange = useCallback(
    async (
      empId: string,
      date: Dayjs,
      value: Construction | null,
      isWeek: boolean,
      cell: ICell
    ) => {
      const cellKey = getCellKey(cell);
      setLoadingCells((prev) => new Set(prev).add(cellKey));

      const { entriesToSave, notSavedDays } = buildScheduleEntriesToSave(
        empId,
        date,
        value,
        isWeek,
        isEmployeeOnVacation
      );

      if (notSavedDays.length > 0) {
        notifications.show(
          `Nie zapisano ${notSavedDays.length} ${notSavedDays.length === 1 ? 'dnia' : 'dni'} (urlop)`,
          {
            severity: 'info',
            autoHideDuration: 5000,
          }
        );
      }

      if (entriesToSave.length === 0) {
        setLoadingCells((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cellKey);
          return newSet;
        });
        return;
      }

      try {
        await updateScheduleMutation.mutateAsync(entriesToSave);
      } catch {
        notifications.show('Błąd zapisu', { severity: 'error' });
      } finally {
        setLoadingCells((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cellKey);
          return newSet;
        });
      }
    },
    [isEmployeeOnVacation, updateScheduleMutation, notifications]
  );

  const getCellContentItems = useCallback(
    (cell: ICell) => {
      return getCellDisplayData(
        cell,
        scheduleMap,
        constructions,
        isEmployeeOnVacation,
        showVacations,
        showDates
      );
    },
    [scheduleMap, constructions, isEmployeeOnVacation, showVacations, showDates]
  );

  const isError = isEmpError || isConstError || isSchedError || vacationsError;
  const isLoading =
    isEmpLoading || isConstLoading || isSchedLoading || vacationsLoading;

  return {
    ...filters,
    activeTable,
    setActiveTable,
    showVacations,
    setShowVacations,
    showDates,
    setShowDates,
    loadingCells,
    setLoadingCells,
    weeks,
    employees,
    constructions,
    scheduleMap,
    filteredEmployees,
    employeesCount,
    isEmployeeOnVacation,
    handleCellChange,
    handlePrint,
    printRef,
    getCellKey,
    getCellContentItems,
    isError,
    isLoading,
  };
};
