import dayjs, { Dayjs } from 'dayjs';
import type { Employee } from '@/entities/employee';
import type {
  BuildEntriesResult,
  CellDisplayItem,
  ICell,
  ScheduleEntryInput,
  ScheduleMap,
} from '../types';
import type { Construction } from '@/entities/construction';
import { daysToRanges } from '@/shared/lib/date';
import type { ScheduleEntry } from '@/entities/shedule';

export const createScheduleMap = (schedules: ScheduleEntry[]): ScheduleMap => {
  const map = new Map<string, Map<string, ScheduleEntry>>();

  schedules.forEach((entry) => {
    if (!map.has(entry.employeeId)) {
      map.set(entry.employeeId, new Map());
    }

    map.get(entry.employeeId)!.set(entry.date, entry);
  });

  return map;
};

export const getCellKey = (cell: ICell): string => {
  return `${cell.empId}-${cell.weekKey}-${cell.date.format('YYYY-MM-DD')}-${cell.isWeek}`;
};

export const generateMonths = (from: Date, to: Date): string[] => {
  const start = dayjs(from);
  const end = dayjs(to);
  const monthsSet = new Set<string>();
  let current = start.startOf('month');

  while (current.isBefore(end) || current.isSame(end, 'month')) {
    monthsSet.add(current.format('YYYY-MM'));
    current = current.add(1, 'month');
  }
  return Array.from(monthsSet);
};

export const generateWeeks = (from: Date, to: Date): Dayjs[] => {
  const start = dayjs(from);
  const end = dayjs(to);
  const arr: Dayjs[] = [];
  let cur = start;

  while (cur.isSame(end, 'week') || cur.isBefore(end, 'week')) {
    arr.push(cur);
    cur = cur.add(1, 'week');
  }
  return arr;
};

export const filterEmployeesList = (
  employees: Employee[],
  selectedEmployees: string[],
  showInactive: boolean,
  selectedConstructions: string[],
  schedule: any[]
): Employee[] => {
  let result = employees;

  if (!showInactive) {
    result = result.filter((emp) => emp.status);
  }

  if (selectedEmployees.length > 0) {
    result = result.filter((e) => selectedEmployees.includes(e.id));
  }

  if (selectedConstructions.length > 0) {
    const activeEmployeeIds = new Set<string>();
    schedule.forEach((entry) => {
      if (selectedConstructions.includes(entry.constructionId)) {
        activeEmployeeIds.add(entry.employeeId);
      }
    });
    result = result.filter((e) => activeEmployeeIds.has(e.id));
  }

  return result;
};

export const getCellDisplayData = (
  cell: ICell,
  scheduleMap: Map<string, Map<string, any>>,
  constructions: Construction[],
  isEmployeeOnVacation: (id: string, d: Date) => boolean,
  showVacations: boolean,
  showDates: boolean
): CellDisplayItem[] => {
  const { empId, weekKey, date, isWeek } = cell;

  if (!isWeek) {
    const hasVacation = isEmployeeOnVacation(empId, date.toDate());
    if (hasVacation) {
      return [
        { id: 'vacation', text: 'Urlop', isVacation: true, isActive: true },
      ];
    }

    const entry = scheduleMap.get(empId)?.get(date.format('YYYY-MM-DD'));
    if (!entry && !entry?.constructionId) return [];

    let cName = entry.constructionName;
    let cActive = entry.constructionActive;

    if (!cName && entry.constructionId) {
      const def = constructions.find((c) => c.id === entry.constructionId);
      cName = def?.name;
      cActive = def?.status;
    }

    if (!cName && entry.constructionId) cName = 'Nieznana';
    if (!cName) return [];

    return [
      {
        id: entry.constructionId || 'unknown',
        text: cName,
        isVacation: false,
        isActive: cActive ?? true,
      },
    ];
  }

  const weekStart = dayjs(weekKey);
  const vacationDays: Dayjs[] = [];
  const cDataMap = new Map<
    string,
    { id: string; days: Dayjs[]; active: boolean }
  >();
  let hasEmptyDays = false;

  for (let i = 0; i < 7; i++) {
    const day = weekStart.add(i, 'day');
    const isVac = isEmployeeOnVacation(empId, day.toDate());
    const dayEntry = scheduleMap.get(empId)?.get(day.format('YYYY-MM-DD'));

    if (isVac) {
      vacationDays.push(day);
    } else if (dayEntry) {
      let cName = dayEntry.constructionName;
      let cActive = dayEntry.constructionActive;
      const cId = dayEntry.constructionId;

      if (!cName && cId) {
        const def = constructions.find((c) => c.id === cId);
        cName = def?.name || '?';
        cActive = def?.status;
      }

      if (cName) {
        if (!cDataMap.has(cName)) {
          cDataMap.set(cName, {
            id: cId || 'unknown',
            days: [],
            active: cActive ?? true,
          });
        }
        cDataMap.get(cName)!.days.push(day);
      } else {
        const unknown = 'Nieznana budowa';
        if (!cDataMap.has(unknown)) {
          cDataMap.set(unknown, { id: 'unknown', days: [], active: true });
        }
        cDataMap.get(unknown)!.days.push(day);
      }
    } else {
      hasEmptyDays = true;
    }
  }

  const items: CellDisplayItem[] = [];

  if (showVacations && vacationDays.length > 0) {
    const text = showDates
      ? `Urlop (${daysToRanges(vacationDays).join(', ')})`
      : 'Urlop';
    items.push({ id: 'vacation', text, isVacation: true, isActive: true });
  }

  const shouldShowRanges =
    cDataMap.size > 1 || vacationDays.length > 0 || hasEmptyDays;

  cDataMap.forEach((data, name) => {
    const isFull = data.days.length >= 6 && cDataMap.size === 1;
    const text =
      !shouldShowRanges || !showDates || isFull
        ? name
        : `${name} (${daysToRanges(data.days).join(', ')})`;

    items.push({
      id: data.id,
      text,
      isVacation: false,
      isActive: data.active,
    });
  });

  return items;
};

export const buildScheduleEntriesToSave = (
  empId: string,
  date: Dayjs,
  value: Construction | null,
  isWeek: boolean,
  isEmployeeOnVacation: (id: string, d: Date) => boolean
): BuildEntriesResult => {
  const entriesToSave: ScheduleEntryInput[] = [];
  const notSavedDays: string[] = [];

  if (isWeek) {
    const startOfWeek = date.startOf('isoWeek');

    for (let i = 0; i < 7; i++) {
      const day = startOfWeek.add(i, 'day');
      const hasVacation = isEmployeeOnVacation(empId, day.toDate());

      if (!hasVacation && i !== 6) {
        entriesToSave.push({
          employeeId: empId,
          date: day.toDate(),
          constructionId: value?.id ?? null,
        });
      } else if (hasVacation && i !== 6) {
        notSavedDays.push(day.format('DD.MM.YYYY'));
      }
    }
  } else {
    entriesToSave.push({
      employeeId: empId,
      date: date.toDate(),
      constructionId: value?.id ?? null,
    });
  }

  return { entriesToSave, notSavedDays };
};
