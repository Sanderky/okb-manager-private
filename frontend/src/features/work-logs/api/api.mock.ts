import { mockDb } from '@/shared/api/mock/mockDb';
import dayjs from 'dayjs';
import { toSqlDate } from '@/shared/lib/date';
import type { WorkLogEntry } from '../model/types';
import { mapToWorkLog, mapToWorkLogPayload } from './mappers';
import { delay } from '@/shared/lib/delay';

const joinRelations = (log: any) => {
  const employee = mockDb.employees.find((e) => e.id === log.employee_id);
  const construction = mockDb.constructions.find(
    (c) => c.id === log.construction_id
  );

  return {
    ...log,
    employees: employee
      ? { name: employee.name, status: employee.status }
      : null,
    constructions: construction
      ? { name: construction.name, status: construction.status }
      : null,
  };
};

const getWeekBoundaries = (weekStart: Date) => {
  return {
    startStr: toSqlDate(weekStart),
    endStr: toSqlDate(dayjs(weekStart).add(6, 'day').toDate()),
  };
};

export const getWorkLogs = async (
  startDate: Date,
  endDate: Date
): Promise<WorkLogEntry[]> => {
  await delay();
  const startStr = toSqlDate(startDate);
  const endStr = toSqlDate(endDate);

  if (!startStr || !endStr) return [];

  const filtered = mockDb.work_logs.filter(
    (log) => log.date >= startStr && log.date <= endStr
  );

  const withRelations = filtered.map(joinRelations);
  return withRelations.map(mapToWorkLog);
};

export const fetchWorkLogsForCopy = async (
  sourceWeekStart: Date
): Promise<WorkLogEntry[]> => {
  await delay();
  const { startStr, endStr } = getWeekBoundaries(sourceWeekStart);

  if (!startStr || !endStr) return [];

  const filtered = mockDb.work_logs.filter(
    (log) => log.date >= startStr && log.date <= endStr
  );

  const withRelations = filtered.map(joinRelations);
  return withRelations.map(mapToWorkLog);
};

export const overrideWorkLogsForWeek = async (
  weekStart: Date,
  newLogs: Omit<WorkLogEntry, 'id'>[]
): Promise<void> => {
  await delay();
  const { startStr, endStr } = getWeekBoundaries(weekStart);

  if (!startStr || !endStr) return;

  mockDb.work_logs = mockDb.work_logs.filter(
    (log) => log.date < startStr || log.date > endStr
  );

  if (newLogs.length > 0) {
    const payloads = newLogs.map(mapToWorkLogPayload);
    const newEntries = payloads.map((payload) => ({
      ...payload,
      id: crypto.randomUUID(),
    }));

    mockDb.work_logs.push(...(newEntries as any[]));
  }
};

export const deleteAllWorkHoursForWeek = async (
  weekStart: Date
): Promise<void> => {
  await delay();
  const { startStr, endStr } = getWeekBoundaries(weekStart);

  if (!startStr || !endStr) return;

  mockDb.work_logs = mockDb.work_logs.filter(
    (log) => log.date < startStr || log.date > endStr
  );
};

export const saveWorkLogDay = async (
  employeeId: string,
  constructionId: string,
  date: Date,
  hours: number | null
): Promise<void> => {
  await delay();
  const dateStr = toSqlDate(date);
  if (!dateStr) throw new Error('Nieprawidłowa data');

  const existingIndex = mockDb.work_logs.findIndex(
    (log) =>
      log.employee_id === employeeId &&
      log.construction_id === constructionId &&
      log.date === dateStr
  );

  if (existingIndex >= 0) {
    mockDb.work_logs[existingIndex].hours = hours as any;
  } else {
    mockDb.work_logs.push({
      id: crypto.randomUUID(),
      employee_id: employeeId,
      construction_id: constructionId,
      date: dateStr,
      hours: hours,
    } as any);
  }
};
