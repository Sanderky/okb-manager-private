import { toSqlDate } from '@/shared/lib/date';
import type { Vacation } from '../model/types';

export const mapVacationFromDB = (row: any): Vacation => ({
  id: row.id,
  employeeId: row.employee_id,
  startDate: new Date(row.start_date),
  endDate: new Date(row.end_date),
  color: row.color,
  description: row.description || '',
  groupId: row.group_id || row.id,
  employeeName: row.employees?.name,
  employeeActive: row.employees?.status,
});

export const mapToVacationPayload = (data: Partial<Vacation>) => {
  const payload: any = {};
  if (data.employeeId) payload.employee_id = data.employeeId;
  if (data.startDate) payload.start_date = toSqlDate(data.startDate);
  if (data.endDate) payload.end_date = toSqlDate(data.endDate);
  if (data.color) payload.color = data.color;
  if (data.description !== undefined) payload.description = data.description;
  return payload;
};
