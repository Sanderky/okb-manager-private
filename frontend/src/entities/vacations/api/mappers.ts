import { toSqlDate } from '@/shared/lib/date';
import type { Vacation } from '../model/types';
import type { VacationDTO } from './types';

export const mapVacationFromDB = (row: VacationDTO): Vacation => {
  let employeeName = undefined;
  let employeeActive = undefined;

  if (Array.isArray(row.employees)) {
    employeeName = row.employees[0]?.name;
    employeeActive = row.employees[0]?.status;
  } else if (row.employees) {
    employeeName = row.employees.name;
    employeeActive = row.employees.status;
  }

  return {
    id: row.id,
    employeeId: row.employee_id,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    color: row.color,
    description: row.description || '',
    groupId: row.group_id || row.id,
    employeeName: employeeName,
    employeeActive: employeeActive,
  };
};

export const mapToVacationPayload = (data: Partial<Vacation>) => {
  const payload: any = {};
  if (data.employeeId) payload.employee_id = data.employeeId;
  if (data.startDate) payload.start_date = toSqlDate(data.startDate);
  if (data.endDate) payload.end_date = toSqlDate(data.endDate);
  if (data.color) payload.color = data.color;
  if (data.description !== undefined) payload.description = data.description;
  return payload;
};
