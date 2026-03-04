import dayjs from 'dayjs';
import type { ScheduleEntry } from '../model/types';

export const mapToScheduleEntry = (row: any): ScheduleEntry => ({
  id: row.id,
  employeeId: row.employee_id,
  constructionId: row.construction_id,
  date: row.date,
  constructionName: row.constructions?.name,
  constructionActive: row.constructions?.status,
  employeeName: row.employees?.name,
  employeeActive: row.employees?.status,
});

export const mapWeeklySchedulesToDomain = (rows: any[], weekStart: Date) => {
  const grouped = new Map<string, any>();

  rows.forEach((row: any) => {
    if (!grouped.has(row.employee_id)) {
      grouped.set(row.employee_id, {
        employeeId: row.employee_id,
        employeeName: row.employees?.name || 'Nieznany',
        employeeActive: row.employees?.status ?? false,
        constructions: [],
      });
    }

    const group = grouped.get(row.employee_id)!;
    const dayIndex = dayjs(row.date).diff(dayjs(weekStart), 'day');

    if (dayIndex >= 0 && dayIndex < 7) {
      group.constructions.push({
        id: row.construction_id,
        name: row.constructions?.name || 'Nieznana',
        active: row.constructions?.status ?? false,
        dayIndex,
      });
    }
  });

  return Array.from(grouped.values());
};
