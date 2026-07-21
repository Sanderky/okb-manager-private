import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { getWeekDates } from '@/shared/lib/date';
import type { Employee } from '@/entities/employee';
import type { Construction } from '@/entities/construction';
import type { Vacation } from '@/entities/vacations';
import type {
  ConstructionsWithWorkHours,
  WorkLogEntry,
  WeeklyTuple,
} from '../types';

import {
  formatWorkLogsForTable,
  buildGroupedConstructionView,
  calculateTotalHours,
  sortConstructionsWithWorkHours,
} from './hoursTableUtils';

dayjs.extend(isSameOrBefore);

interface WeekReportData {
  weekStart: Date;
  workLogs: WorkLogEntry[];
  vacations: Vacation[];
}

const buildVacationMap = (vacations: Vacation[]) => {
  const map = new Map<string, Set<string>>();
  vacations.forEach((v) => {
    let curr = dayjs(v.startDate);
    const end = dayjs(v.endDate);
    if (!map.has(v.employeeId)) map.set(v.employeeId, new Set());

    while (curr.isSameOrBefore(end)) {
      map.get(v.employeeId)!.add(curr.format('YYYY-MM-DD'));
      curr = curr.add(1, 'day');
    }
  });
  return map;
};

export const processSingleWeekData = (
  data: WeekReportData | undefined,
  currentWeekStart: Date,
  allEmployees: Employee[],
  allConstructions: Construction[],
  selectedEmployeeIds: string[],
  selectedConstructionIds: string[]
) => {
  const weekDates = getWeekDates(currentWeekStart);

  const defaultResult = {
    weekStart: currentWeekStart,
    constructionsWithWorkHours: [] as ConstructionsWithWorkHours[],
    weekDates,
    totalHoursData: {
      dailyTotals: [0, 0, 0, 0, 0, 0, 0] as WeeklyTuple<number>,
      grandTotal: 0,
    },
  };

  if (!data) return defaultResult;

  const { workLogs, vacations } = data;
  const vacationMap = buildVacationMap(vacations);

  const isEmployeeOnVacation = (empId: string, date: Date) =>
    vacationMap.get(empId)?.has(dayjs(date).format('YYYY-MM-DD')) ?? false;

  const selectedEmployees = allEmployees.filter((e) =>
    selectedEmployeeIds.includes(e.id)
  );
  const selectedConstructions = allConstructions.filter((c) =>
    selectedConstructionIds.includes(c.id)
  );

  const enrichedWorkLogs = workLogs.map((log) => {
    const cDef = allConstructions.find((c) => c.id === log.constructionId);
    const eDef = allEmployees.find((e) => e.id === log.employeeId);
    return {
      ...log,
      constructionName: log.constructionName || cDef?.name,
      constructionActive: log.constructionActive ?? cDef?.status ?? true,
      employeeName: log.employeeName || eDef?.name,
      employeeActive: log.employeeActive ?? eDef?.status ?? true,
    };
  });

  const formattedWorkHours = formatWorkLogsForTable(
    enrichedWorkLogs,
    currentWeekStart
  );

  const groupedConstructions = buildGroupedConstructionView(
    formattedWorkHours,
    currentWeekStart,
    selectedEmployees,
    selectedConstructions,
    isEmployeeOnVacation
  );

  const totalHoursData = calculateTotalHours(
    formattedWorkHours,
    currentWeekStart,
    selectedEmployees,
    selectedConstructions,
    isEmployeeOnVacation
  );

  const finalSortedData = sortConstructionsWithWorkHours(groupedConstructions);

  return {
    weekStart: currentWeekStart,
    constructionsWithWorkHours: finalSortedData,
    weekDates,
    totalHoursData,
  };
};
