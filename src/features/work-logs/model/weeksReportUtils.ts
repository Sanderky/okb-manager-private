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
} from './types';

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

  const selEmpIds = new Set(selectedEmployeeIds);
  const selConIds = new Set(selectedConstructionIds);
  const constructionMap = new Map<string, ConstructionsWithWorkHours>();

  workLogs.forEach((log) => {
    if (selEmpIds.size > 0 && !selEmpIds.has(log.employeeId)) return;
    if (selConIds.size > 0 && !selConIds.has(log.constructionId)) return;

    const cDef = allConstructions.find((c) => c.id === log.constructionId);
    const eDef = allEmployees.find((e) => e.id === log.employeeId);

    if (!constructionMap.has(log.constructionId)) {
      constructionMap.set(log.constructionId, {
        id: log.constructionId,
        name: log.constructionName || cDef?.name || 'Nieznana budowa',
        isActive: log.constructionActive ?? cDef?.status ?? true,
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
        employeeName: log.employeeName || eDef?.name || 'Nieznany pracownik',
        isActive: log.employeeActive ?? eDef?.status ?? true,
        hours: [0, 0, 0, 0, 0, 0, 0] as WeeklyTuple<number | null>,
        total: 0,
        isOnVacation: [
          false,
          false,
          false,
          false,
          false,
          false,
          false,
        ] as WeeklyTuple<boolean>,
      };
      group.workHours.push(workHourEntry);
    }

    const dayIndex = weekDates.findIndex(
      (d) =>
        dayjs(d).format('YYYY-MM-DD') === dayjs(log.date).format('YYYY-MM-DD')
    );

    if (dayIndex !== -1) {
      workHourEntry.hours[dayIndex] = log.hours;
    }
  });

  const dailyTotals: WeeklyTuple<number> = [0, 0, 0, 0, 0, 0, 0];
  let grandTotal = 0;

  constructionMap.forEach((group) => {
    group.workHours.forEach((wh) => {
      wh.isOnVacation = weekDates.map((d) =>
        isEmployeeOnVacation(wh.employeeId, d)
      ) as WeeklyTuple<boolean>;
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
};
