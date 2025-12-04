import { useQueries } from '@tanstack/react-query';
import { getMonthKeysFromWeek, getWeekDates } from './HoursHelpers';
import dayjs from 'dayjs';
import { useMemo } from 'react';
// ZMIANA: Importy z services
import { getConstructionList } from '../../../services/constructions';
import { getEmployeeList } from '../../../services/employees';
import { getWorkLogs } from '../../../services/workLogs';
import { getVacationListForMonths } from '../../../services/vacations';
import type { ConstructionsWithWorkHours } from './useHoursTable';
import type {
  Construction,
  Employee,
  Vacation,
  WorkLogEntry,
} from '../../../types';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrBefore);

interface UseWeekReportResult {
  weeksData: Array<{
    weekStart: Date;
    constructionsWithWorkHours: ConstructionsWithWorkHours[];
    weekDates: Date[];
    totalHoursData: { dailyTotals: number[]; grandTotal: number };
  }>;
  isLoading: boolean;
  error: Error | null;
}

interface WeekReportData {
  weekStart: Date;
  workLogs: WorkLogEntry[];
  vacations: Vacation[];
  employees: Employee[];
  constructions: Construction[];
}

interface UseWeekReportParams {
  weekStarts: Date[];
  selectedConstructions?: Construction[];
  selectedEmployees?: Employee[];
}

const useWeekReport = ({
  weekStarts,
  selectedConstructions = [],
  selectedEmployees = [],
}: UseWeekReportParams): UseWeekReportResult => {
  const selectedConstructionIds = selectedConstructions.map((c) => c.id);
  const selectedEmployeeIds = selectedEmployees.map((e) => e.id);

  const weekQueries = useQueries({
    queries: weekStarts.map((weekStart) => ({
      queryKey: [
        'weekReport',
        weekStart.toISOString(),
        selectedConstructionIds.join(','),
        selectedEmployeeIds.join(','),
      ],
      queryFn: async () => {
        const weekEnd = dayjs(weekStart).add(6, 'day').toDate();

        // 1. Pobieramy dane równolegle
        const [workLogs, vacations] = await Promise.all([
          getWorkLogs(weekStart, weekEnd),
          getVacationListForMonths(getMonthKeysFromWeek(weekStart)),
        ]);

        const [employees, constructions] = await Promise.all([
          getEmployeeList(),
          getConstructionList(),
        ]);

        return {
          weekStart,
          workLogs,
          vacations,
          employees,
          constructions,
        } as WeekReportData;
      },
      staleTime: 1000 * 60 * 5,
    })),
  });

  const isLoading = weekQueries.some((query) => query.isLoading);
  const error =
    (weekQueries.find((query) => query.error)?.error as Error) || null;

  const weeksData = useMemo(() => {
    if (isLoading) return [];

    return weekQueries.map((query, index) => {
      const data = query.data as WeekReportData | undefined;
      const currentWeekStart = weekStarts[index] || new Date();
      const weekDates = getWeekDates(currentWeekStart);

      if (!data) {
        return {
          weekStart: currentWeekStart,
          constructionsWithWorkHours: [],
          weekDates,
          totalHoursData: { dailyTotals: [0, 0, 0, 0, 0, 0, 0], grandTotal: 0 },
        };
      }

      const { workLogs, vacations, employees, constructions } = data;

      const vacationMap = new Map<string, Set<string>>();
      vacations.forEach((vacation) => {
        let curr = dayjs(vacation.startDate);
        const end = dayjs(vacation.endDate);

        if (!vacationMap.has(vacation.employeeId)) {
          vacationMap.set(vacation.employeeId, new Set());
        }

        while (curr.isSameOrBefore(end)) {
          vacationMap.get(vacation.employeeId)!.add(curr.format('YYYY-MM-DD'));
          curr = curr.add(1, 'day');
        }
      });

      const isEmployeeOnVacation = (
        employeeId: string,
        date: Date
      ): boolean => {
        const employeeVacations = vacationMap.get(employeeId);
        if (!employeeVacations) return false;
        return employeeVacations.has(dayjs(date).format('YYYY-MM-DD'));
      };

      const constructionMap = new Map<string, ConstructionsWithWorkHours>();

      const selEmpIds = new Set(selectedEmployeeIds);
      const selConIds = new Set(selectedConstructionIds);

      workLogs.forEach((log) => {
        if (selEmpIds.size > 0 && !selEmpIds.has(log.employeeId)) return;
        if (selConIds.size > 0 && !selConIds.has(log.constructionId)) return;

        const cDef = constructions.find((c) => c.id === log.constructionId);
        const eDef = employees.find((e) => e.id === log.employeeId);

        const cName = log.constructionName || cDef?.name || 'Nieznana budowa';
        const cAct = log.constructionActive ?? cDef?.status ?? true;
        const eName = log.employeeName || eDef?.name || 'Nieznany pracownik';
        const eAct = log.employeeActive ?? eDef?.status ?? true;

        if (!constructionMap.has(log.constructionId)) {
          constructionMap.set(log.constructionId, {
            id: log.constructionId,
            name: cName,
            isActive: cAct,
            workHours: [],
            totalHours: 0,
          });
        }

        const group = constructionMap.get(log.constructionId)!;

        let workHourEntry = group.workHours.find(
          (wh) => wh.employeeId === log.employeeId
        );

        if (!workHourEntry) {
          workHourEntry = {
            id: `${log.constructionId}_${log.employeeId}_${currentWeekStart.getTime()}`,
            employeeId: log.employeeId,
            employeeName: eName,
            isActive: eAct,
            hours: [0, 0, 0, 0, 0, 0, 0],
            total: 0,
            isOnVacation: [false, false, false, false, false, false, false],
          };
          group.workHours.push(workHourEntry);
        }

        const logDateStr = dayjs(log.date).format('YYYY-MM-DD');
        const dayIndex = weekDates.findIndex(
          (d) => dayjs(d).format('YYYY-MM-DD') === logDateStr
        );

        if (dayIndex !== -1) {
          workHourEntry.hours[dayIndex] = log.hours;
        }
      });

      const dailyTotals = [0, 0, 0, 0, 0, 0, 0];
      let grandTotal = 0;

      constructionMap.forEach((group) => {
        group.workHours.forEach((wh) => {
          wh.isOnVacation = weekDates.map((d) =>
            isEmployeeOnVacation(wh.employeeId, d)
          );

          wh.total = wh.hours.reduce(
            (sum, h, i) => (wh.isOnVacation[i] ? sum : sum + h),
            0
          );
          group.totalHours += wh.total;

          wh.hours.forEach((h, i) => {
            if (!wh.isOnVacation[i]) {
              dailyTotals[i] += h;
              grandTotal += h;
            }
          });
        });

        group.workHours.sort((a, b) =>
          a.employeeName.localeCompare(b.employeeName)
        );
      });

      const constructionsWithWorkHours = Array.from(
        constructionMap.values()
      ).sort((a, b) => a.name.localeCompare(b.name));

      return {
        weekStart: currentWeekStart,
        constructionsWithWorkHours,
        weekDates,
        totalHoursData: { dailyTotals, grandTotal },
      };
    });
  }, [
    weekQueries,
    isLoading,
    weekStarts,
    selectedConstructionIds,
    selectedEmployeeIds,
  ]);

  return {
    weeksData,
    isLoading,
    error,
  };
};

export default useWeekReport;
