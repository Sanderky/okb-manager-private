import { useQueries } from '@tanstack/react-query';
import { getMonthKeysFromWeek, getWeekDates } from './HoursHelpers';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { getConstructionList } from '../../../api/constructions';
import { getEmployeeList } from '../../../api/employees';
import { getWorkHoursList } from '../../../api/hours';
import { getVacationListForMonths } from '../../../api/vacations';
import type { ConstructionsWithWorkHours } from './useHoursTable';
import type {
  Construction,
  Employee,
  Vacation,
  WorkHours,
} from '../../../types';

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
  workHours: WorkHours[];
  vacations: Vacation[]; // Użyj właściwego typu dla vacations
  employees: Employee[];
  constructions: Construction[];
}

const useWeekReport = (weekStarts: Date[]): UseWeekReportResult => {
  const weekQueries = useQueries({
    queries: weekStarts.map((weekStart) => ({
      queryKey: ['weekReport', weekStart.toISOString()],
      queryFn: async () => {
        const [workHours, vacations] = await Promise.all([
          getWorkHoursList(weekStart),
          getVacationListForMonths(getMonthKeysFromWeek(weekStart)),
        ]);

        const [employees, constructions] = await Promise.all([
          getEmployeeList(),
          getConstructionList(),
        ]);

        return {
          weekStart,
          workHours,
          vacations,
          employees,
          constructions,
        } as WeekReportData;
      },

      staleTime: 0,
    })),
  });

  const isLoading = weekQueries.some((query) => query.isLoading);
  const error =
    (weekQueries.find((query) => query.error)?.error as Error) || null;

  const weeksData = useMemo(() => {
    if (isLoading) return [];

    return weekQueries.map((query, index) => {
      //   if (!query.data) {
      //     return {
      //       weekStart: query.data?.weekStart || new Date(),
      //       constructionsWithWorkHours: [],
      //       weekDates: getWeekDates(query.data?.weekStart || new Date()),
      //       totalHoursData: { dailyTotals: [0,0,0,0,0,0,0], grandTotal: 0 }
      //     };
      //   }
      const data = query.data as WeekReportData | undefined;

      if (!data) {
        const weekStart = weekStarts[index] || new Date();
        return {
          weekStart,
          constructionsWithWorkHours: [],
          weekDates: getWeekDates(weekStart),
          totalHoursData: { dailyTotals: [0, 0, 0, 0, 0, 0, 0], grandTotal: 0 },
        };
      }

      const { weekStart, workHours, vacations, employees, constructions } =
        data;

      const vacationMap = new Map<string, Set<string>>();
      vacations.forEach((vacation) => {
        if (!vacation.employeeId || !vacation.date) return;
        const dateObj = vacation.date.toDate();
        const dateString = dayjs(dateObj).format('YYYY-MM-DD');
        if (!vacationMap.has(vacation.employeeId)) {
          vacationMap.set(vacation.employeeId, new Set());
        }
        vacationMap.get(vacation.employeeId)!.add(dateString);
      });

      const weekDates = getWeekDates(weekStart);

      const isEmployeeOnVacation = (
        employeeId: string,
        date: Date
      ): boolean => {
        const employeeVacations = vacationMap.get(employeeId);
        if (!employeeVacations) return false;
        const dateString = dayjs(date).format('YYYY-MM-DD');
        return employeeVacations.has(dateString);
      };

      const totalHoursData = (() => {
        if (!workHours)
          return { dailyTotals: [0, 0, 0, 0, 0, 0, 0], grandTotal: 0 };

        const dailyTotals = [0, 0, 0, 0, 0, 0, 0];
        let grandTotal = 0;

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
      })();

      const constructionsWithWorkHours = (() => {
        if (!workHours || !constructions || !employees) return [];

        const constructionMap = new Map<string, ConstructionsWithWorkHours>();
        const weekDates = getWeekDates(weekStart);

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
      })();

      return {
        weekStart,
        constructionsWithWorkHours,
        weekDates,
        totalHoursData,
      };
    });
  }, [weekQueries, isLoading]);

  return {
    weeksData,
    isLoading,
    error,
  };
};
export default useWeekReport;
