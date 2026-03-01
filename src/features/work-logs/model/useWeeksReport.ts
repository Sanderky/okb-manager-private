import { useQueries, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { ConstructionApi } from '@/entities/construction';
import { EmployeeApi } from '@/entities/employee';
import { getWorkLogs } from '../api/workLogs';
import { VacationApi, type Vacation } from '@/entities/vacations';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import type { ConstructionsWithWorkHours, WorkLogEntry } from './types';
import { getMonthKeysFromWeek, getWeekDates } from '@/shared/lib/date';

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
}

interface UseWeekReportParams {
  weekStarts: Date[];
  selectedConstructionIds?: string[];
  selectedEmployeeIds?: string[];
}

const useWeekReport = ({
  weekStarts,
  selectedConstructionIds = [],
  selectedEmployeeIds = [],
}: UseWeekReportParams): UseWeekReportResult => {
  const { data: allEmployees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => EmployeeApi.getEmployeeList(),
  });

  const { data: allConstructions = [], isLoading: constructionsLoading } =
    useQuery({
      queryKey: ['constructions'],
      queryFn: () => ConstructionApi.getConstructionList(),
    });

  const weekQueries = useQueries({
    queries: weekStarts.map((weekStart) => ({
      queryKey: ['weekReportData', weekStart.toISOString()],
      queryFn: async () => {
        const weekEnd = dayjs(weekStart).add(6, 'day').toDate();
        const [workLogs, vacations] = await Promise.all([
          getWorkLogs(weekStart, weekEnd),
          VacationApi.getVacationListForMonths(getMonthKeysFromWeek(weekStart)),
        ]);
        return { weekStart, workLogs, vacations } as WeekReportData;
      }
    })),
  });

  const isDataLoading = weekQueries.some((query) => query.isLoading);
  const isLoading = isDataLoading || employeesLoading || constructionsLoading;
  const error =
    (weekQueries.find((query) => query.error)?.error as Error) || null;

  const weeksData = useMemo(() => {
    if (isLoading || !allEmployees.length || !allConstructions.length)
      return [];

    return weekQueries.map((query, index) => {
      const data = query.data;
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

      const { workLogs, vacations } = data;

      const vacationMap = new Map<string, Set<string>>();
      vacations.forEach((v) => {
        let curr = dayjs(v.startDate);
        const end = dayjs(v.endDate);
        if (!vacationMap.has(v.employeeId))
          vacationMap.set(v.employeeId, new Set());
        while (curr.isSameOrBefore(end)) {
          vacationMap.get(v.employeeId)!.add(curr.format('YYYY-MM-DD'));
          curr = curr.add(1, 'day');
        }
      });

      const isEmployeeOnVacation = (empId: string, date: Date) =>
        vacationMap.get(empId)?.has(dayjs(date).format('YYYY-MM-DD')) ?? false;

      const selEmpIds = new Set(selectedEmployeeIds);
      const selConIds = new Set(selectedConstructionIds);

      const constructionMap = new Map<string, ConstructionsWithWorkHours>();

      workLogs.forEach((log) => {
        if (selEmpIds.size > 0 && !selEmpIds.has(log.employeeId)) return;
        if (selConIds.size > 0 && !selConIds.has(log.constructionId)) return;

        const cDef = allConstructions.find((c) => c.id === log.constructionId);
        const eDef = allEmployees.find((e) => e.id === log.employeeId);

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
            isOnVacation: [],
          };
          group.workHours.push(workHourEntry);
        }

        const dayIndex = weekDates.findIndex(
          (d) =>
            dayjs(d).format('YYYY-MM-DD') ===
            dayjs(log.date).format('YYYY-MM-DD')
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

          wh.total = wh.hours.reduce<number>(
            (sum, h, i) => (wh.isOnVacation[i] ? sum : sum + (h ?? 0)),
            0
          );
          group.totalHours += wh.total;

          wh.hours.forEach((h, i) => {
            if (!wh.isOnVacation[i]) {
              const val = h ?? 0;
              dailyTotals[i] += val;
              grandTotal += val;
            }
          });
        });
        group.workHours.sort((a, b) =>
          a.employeeName.localeCompare(b.employeeName)
        );
      });

      const res = Array.from(constructionMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      return {
        weekStart: currentWeekStart,
        constructionsWithWorkHours: res,
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
    allEmployees,
    allConstructions,
  ]);

  return { weeksData, isLoading, error };
};

export default useWeekReport;
