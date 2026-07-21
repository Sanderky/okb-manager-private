import dayjs from 'dayjs';
import type { ScheduleEntry, WeeklyEmployeeSchedule } from '../model/types';
import type { DailyScheduleDTO } from './types';

const extractRelation = <T>(relation: T | T[] | null | undefined): T | null => {
  if (Array.isArray(relation)) return relation[0] || null;
  return relation || null;
};

export const mapToScheduleEntry = (row: DailyScheduleDTO): ScheduleEntry => {
  const construction = extractRelation(row.constructions);
  const employee = extractRelation(row.employees);

  return {
    id: row.id,
    employeeId: row.employee_id,
    constructionId: row.construction_id,
    date: row.date,
    constructionName: construction?.name,
    constructionActive: construction?.status,
    employeeName: employee?.name,
    employeeActive: employee?.status,
  };
};

export const mapWeeklySchedulesToDomain = (
  rows: DailyScheduleDTO[],
  weekStart: Date
): WeeklyEmployeeSchedule[] => {
  const grouped = new Map<string, WeeklyEmployeeSchedule>();

  rows.forEach((row) => {
    const employee = extractRelation(row.employees);
    const construction = extractRelation(row.constructions);

    if (!grouped.has(row.employee_id)) {
      grouped.set(row.employee_id, {
        employeeId: row.employee_id,
        employeeName: employee?.name || 'Nieznany',
        employeeActive: employee?.status ?? false,
        constructions: [],
      });
    }

    const group = grouped.get(row.employee_id)!;
    const dayIndex = dayjs(row.date).diff(dayjs(weekStart), 'day');

    if (dayIndex >= 0 && dayIndex < 7) {
      group.constructions.push({
        id: row.construction_id,
        name: construction?.name || 'Nieznana',
        active: construction?.status ?? false,
        dayIndex,
      });
    }
  });

  return Array.from(grouped.values());
};
