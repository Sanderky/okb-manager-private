import dayjs from 'dayjs';
import { getWeekDates } from '@/shared/lib/date';
import type {
  WorkHours,
  ConstructionsWithWorkHours,
  WeeklyTuple,
  WorkLogEntry,
} from './types';
import { sortByLastName, type Employee } from '@/entities/employee';
import type { Construction } from '@/entities/construction';
import type { IsoDateString } from '@/shared/model/types';

export const formatWorkLogsForTable = (
  workLogsRaw: any[],
  currentWeek: Date
): WorkHours[] => {
  if (!workLogsRaw || workLogsRaw.length === 0) return [];

  const grouped = new Map<string, WorkHours>();
  const weekDates = getWeekDates(currentWeek);

  workLogsRaw.forEach((log) => {
    const key = `${log.constructionId}_${log.employeeId}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: `${log.constructionId}_${log.employeeId}_${currentWeek.getTime()}`,
        constructionId: log.constructionId,
        employeeId: log.employeeId,
        weekStart: currentWeek,
        hours: [null, null, null, null, null, null, null],
        employeeName: log.employeeName,
        employeeActive: log.employeeActive,
        constructionName: log.constructionName,
        constructionActive: log.constructionActive,
      });
    }

    const entry = grouped.get(key)!;
    const dIndex = weekDates.findIndex(
      (d) =>
        dayjs(d).format('YYYY-MM-DD') === dayjs(log.date).format('YYYY-MM-DD')
    );

    if (dIndex !== -1) entry.hours[dIndex] = log.hours;
  });

  return Array.from(grouped.values());
};

export const buildGroupedConstructionView = (
  displayedWorkHours: WorkHours[],
  currentWeek: Date,
  selectedEmployees: Employee[],
  selectedConstructions: Construction[],
  isEmployeeOnVacation: (employeeId: string, date: Date) => boolean
): ConstructionsWithWorkHours[] => {
  if (!displayedWorkHours || displayedWorkHours.length === 0) return [];

  const map = new Map<string, ConstructionsWithWorkHours>();
  const dates = getWeekDates(currentWeek);

  const sE = new Set(selectedEmployees.map((x) => x.id));
  const sC = new Set(selectedConstructions.map((x) => x.id));

  displayedWorkHours.forEach((wh) => {
    if (sE.size && !sE.has(wh.employeeId)) return;
    if (sC.size && !sC.has(wh.constructionId)) return;

    const cName = wh.constructionName || 'Nieznana budowa';
    const cAct = wh.constructionActive ?? true;
    const eName = wh.employeeName || 'Nieznany pracownik';
    const eAct = wh.employeeActive ?? true;

    if (!map.has(wh.constructionId)) {
      map.set(wh.constructionId, {
        id: wh.constructionId,
        name: cName,
        isActive: cAct,
        workHours: [],
        totalHours: 0,
      });
    }

    const g = map.get(wh.constructionId)!;

    const vac = dates.map((d) =>
      isEmployeeOnVacation(wh.employeeId, d)
    ) as WeeklyTuple<boolean>;

    const tot = wh.hours.reduce<number>(
      (s, h, i) => (vac[i] ? s : s + (h ?? 0)),
      0
    );

    g.workHours.push({
      id: wh.id,
      employeeId: wh.employeeId,
      employeeName: eName,
      isActive: eAct,
      hours: wh.hours,
      total: tot,
      isOnVacation: vac,
    });

    g.totalHours += tot;
  });

  const res = Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  res.forEach((g) =>
    g.workHours.sort((a, b) => a.employeeName.localeCompare(b.employeeName))
  );

  return res;
};

export const calculateTotalHours = (
  displayedWorkHours: WorkHours[],
  currentWeek: Date,
  selectedEmployees: Employee[],
  selectedConstructions: Construction[],
  isEmployeeOnVacation: (employeeId: string, date: Date) => boolean
) => {
  const defaultResult = {
    dailyTotals: [0, 0, 0, 0, 0, 0, 0] as WeeklyTuple<number>,
    grandTotal: 0,
  };

  if (!displayedWorkHours || displayedWorkHours.length === 0) {
    return defaultResult;
  }

  const dt: WeeklyTuple<number> = [0, 0, 0, 0, 0, 0, 0];
  let gt = 0;

  const dates = getWeekDates(currentWeek);
  const sE = new Set(selectedEmployees.map((x) => x.id));
  const sC = new Set(selectedConstructions.map((x) => x.id));
  displayedWorkHours.forEach((w) => {
    if (sE.size && !sE.has(w.employeeId)) return;
    if (sC.size && !sC.has(w.constructionId)) return;

    w.hours.forEach((h, i) => {
      if (!isEmployeeOnVacation(w.employeeId, dates[i])) {
        dt[i] += h ?? 0;
        gt += h ?? 0;
      }
    });
  });

  return { dailyTotals: dt, grandTotal: gt };
};

export const parseHoursInput = (val: number | string | null): number | null => {
  if (val === null || val === '') return null;
  if (typeof val === 'number') return val;

  const parsed = parseFloat(val);
  return isNaN(parsed) ? null : parsed;
};

export const updateSingleWorkHour = (
  workHours: WorkHours[],
  targetId: string,
  dayIndex: number,
  newValue: number | null
): WorkHours[] => {
  const targetIndex = workHours.findIndex((w) => w.id === targetId);
  if (targetIndex === -1) return workHours;

  const item = workHours[targetIndex];
  if (item.hours[dayIndex] === newValue) return workHours;

  const newHours = [...item.hours] as WeeklyTuple<number | null>;
  newHours[dayIndex] = newValue;

  const simpleTotal = newHours.reduce<number>(
    (acc, curr) => acc + (curr ?? 0),
    0
  );

  const newWorkHours = [...workHours];
  newWorkHours[targetIndex] = {
    ...item,
    hours: newHours,
    total: simpleTotal,
  };

  return newWorkHours;
};

export const flattenWorkHoursToLogs = (
  whs: WorkHours[],
  currentWeek: Date
): Omit<WorkLogEntry, 'id'>[] => {
  const dates = getWeekDates(currentWeek);
  const logs: Omit<WorkLogEntry, 'id'>[] = [];

  whs.forEach((w) => {
    w.hours.forEach((h, i) => {
      if (h !== undefined) {
        logs.push({
          employeeId: w.employeeId,
          constructionId: w.constructionId,
          date: dayjs(dates[i]).format('YYYY-MM-DD') as IsoDateString,
          hours: h,
        });
      }
    });
  });

  return logs;
};

export const enrichAndFilterNewWorkHours = (
  existingWorkHours: WorkHours[],
  newEntries: WorkHours[],
  currentWeek: Date,
  constructions: Construction[],
  employees: Employee[],
  isEmployeeOnVacation: (id: string, d: Date) => boolean
): WorkHours[] => {
  const existingKeys = new Set(
    existingWorkHours.map((x) => `${x.constructionId}_${x.employeeId}`)
  );

  const uniqueNewEntries = newEntries.filter(
    (x) => !existingKeys.has(`${x.constructionId}_${x.employeeId}`)
  );

  if (uniqueNewEntries.length === 0) return existingWorkHours;

  const dates = getWeekDates(currentWeek);

  const enriched = uniqueNewEntries.map((wh) => {
    const cDef = constructions.find((c) => c.id === wh.constructionId);
    const eDef = employees.find((e) => e.id === wh.employeeId);

    const hoursWithVacations = wh.hours.map((h, i) => {
      if (isEmployeeOnVacation(wh.employeeId, dates[i])) return 0;
      return h;
    }) as WeeklyTuple<number | null>;

    return {
      ...wh,
      hours: hoursWithVacations,
      employeeName: eDef?.name,
      employeeActive: eDef?.status,
      constructionName: cDef?.name,
      constructionActive: cDef?.status,
    };
  });

  return [...existingWorkHours, ...enriched];
};

export const sortConstructionsWithWorkHours = (
  data: ConstructionsWithWorkHours[]
): ConstructionsWithWorkHours[] => {
  if (!data || data.length === 0) return data;
  return data
    .map((construction) => ({
      ...construction,
      workHours: [...construction.workHours].sort((a, b) =>
        sortByLastName(a.employeeName, b.employeeName)
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const createEmptyWorkHours = (
  constructionId: string,
  employees: Employee[],
  currentWeek: Date
): WorkHours[] => {
  return employees.map((employee) => ({
    id: `${constructionId}_${employee.id}_${currentWeek.getTime()}`,
    constructionId,
    employeeId: employee.id,
    weekStart: currentWeek,
    hours: [null, null, null, null, null, null, null],
  }));
};
