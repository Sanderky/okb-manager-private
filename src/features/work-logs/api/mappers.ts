import type { WorkLogEntry } from '../model/types';
import { toSqlDate } from '@/shared/lib/date';

export const mapToWorkLog = (row: any): WorkLogEntry => ({
  id: row.id,
  employeeId: row.employee_id,
  constructionId: row.construction_id,
  date: row.date,
  hours: row.hours === null ? null : Number(row.hours),
  employeeName: row.employees?.name,
  constructionName: row.constructions?.name,
  employeeActive: row.employees?.status,
  constructionActive: row.constructions?.status,
});

export const mapToWorkLogPayload = (log: Omit<WorkLogEntry, 'id'>) => ({
  employee_id: log.employeeId,
  construction_id: log.constructionId,
  date: typeof log.date === 'string' ? log.date : toSqlDate(log.date),
  hours: log.hours,
});
