import type { WorkLogEntry } from '../model/types';
import { toSqlDate } from '@/shared/lib/date';
import type { WorkLogDTO } from './types';

const extractRelation = <T>(relation: T | T[] | null | undefined): T | null => {
  if (Array.isArray(relation)) return relation[0] || null;
  return relation || null;
};

export const mapToWorkLog = (row: WorkLogDTO): WorkLogEntry => {
  const employee = extractRelation(row.employees);
  const construction = extractRelation(row.constructions);

  return {
    id: row.id,
    employeeId: row.employee_id,
    constructionId: row.construction_id,
    date: row.date,
    hours: row.hours === null ? null : Number(row.hours),

    employeeName: employee?.name,
    constructionName: construction?.name,
    employeeActive: employee?.status,
    constructionActive: construction?.status,
  };
};

export const mapToWorkLogPayload = (
  log: Omit<WorkLogEntry, 'id'>
): Omit<WorkLogDTO, 'id' | 'employees' | 'constructions'> => ({
  employee_id: log.employeeId,
  construction_id: log.constructionId,
  date: typeof log.date === 'string' ? log.date : (toSqlDate(log.date) ?? ''),
  hours: log.hours,
});
