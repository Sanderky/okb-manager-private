import { mockDb } from '@/shared/api/mock/mockDb';
import dayjs from 'dayjs';
import { toSqlDate } from '@/shared/lib/date';
import type { ScheduleEntry } from '../model/types';
import { mapToScheduleEntry, mapWeeklySchedulesToDomain } from './mappers';
import { delay } from '@/shared/lib/delay';

const joinRelations = (schedule: any) => {
  const employee = mockDb.employees.find((e) => e.id === schedule.employee_id);
  const construction = mockDb.constructions.find(
    (c) => c.id === schedule.construction_id
  );

  return {
    ...schedule,
    employees: employee
      ? { name: employee.name, status: employee.status }
      : null,
    constructions: construction
      ? { name: construction.name, status: construction.status }
      : null,
  };
};

export const getScheduleListForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<ScheduleEntry[]> => {
  await delay();
  const startStr = toSqlDate(startDate);
  const endStr = toSqlDate(endDate);

  if (!startStr || !endStr) return [];

  const filtered = mockDb.daily_schedules.filter(
    (s) => s.date >= startStr && s.date <= endStr
  );

  const withRelations = filtered.map(joinRelations);
  return withRelations.map(mapToScheduleEntry);
};

export const saveScheduleList = async (
  entries: { employeeId: string; date: Date; constructionId: string | null }[]
): Promise<void> => {
  await delay();
  if (entries.length === 0) return;

  entries.forEach((entry) => {
    const dateStr = toSqlDate(entry.date);

    if (!dateStr) return;

    if (entry.constructionId === null) {
      mockDb.daily_schedules = mockDb.daily_schedules.filter(
        (s) => !(s.employee_id === entry.employeeId && s.date === dateStr)
      );
    } else {
      const existingIndex = mockDb.daily_schedules.findIndex(
        (s) => s.employee_id === entry.employeeId && s.date === dateStr
      );

      if (existingIndex >= 0) {
        mockDb.daily_schedules[existingIndex].construction_id =
          entry.constructionId;
      } else {
        mockDb.daily_schedules.push({
          id: crypto.randomUUID(),
          employee_id: entry.employeeId,
          construction_id: entry.constructionId,
          date: dateStr,
        });
      }
    }
  });
};

export const saveScheduleDay = async (
  employeeId: string,
  date: Date,
  constructionId: string | null
): Promise<void> => {
  await delay();
  const dateStr = toSqlDate(date);

  if (!dateStr) throw new Error('Nieprawidłowa data');

  if (constructionId) {
    const existingIndex = mockDb.daily_schedules.findIndex(
      (s) => s.employee_id === employeeId && s.date === dateStr
    );

    if (existingIndex >= 0) {
      mockDb.daily_schedules[existingIndex].construction_id = constructionId;
    } else {
      mockDb.daily_schedules.push({
        id: crypto.randomUUID(),
        employee_id: employeeId,
        construction_id: constructionId,
        date: dateStr,
      });
    }
  } else {
    mockDb.daily_schedules = mockDb.daily_schedules.filter(
      (s) => !(s.employee_id === employeeId && s.date === dateStr)
    );
  }
};

export const removeEmployeeSchedules = async (
  employeeId: string
): Promise<void> => {
  await delay();
  mockDb.daily_schedules = mockDb.daily_schedules.filter(
    (s) => s.employee_id !== employeeId
  );
};

export const getScheduleListForWeek = async (weekStart: Date) => {
  await delay();
  const startStr = toSqlDate(weekStart);
  const endStr = toSqlDate(dayjs(weekStart).add(6, 'day').toDate());

  if (!startStr || !endStr) return [];

  const filtered = mockDb.daily_schedules.filter(
    (s) => s.date >= startStr && s.date <= endStr
  );

  const withRelations = filtered.map(joinRelations);

  return mapWeeklySchedulesToDomain(withRelations, weekStart);
};
