import { toSqlDate } from '@/shared/lib/date';
import type { Lodging, LodgingAssignment } from '../model/types';
import type { LodgingDTO, LodgingEmployeeDTO } from './types';

export const mapLodgingFromDB = (row: LodgingDTO): Lodging => ({
  id: row.id,
  name: row.name ?? undefined,
  address: row.address ?? undefined,
  startDate: row.start_date,
  endDate: row.end_date,
  description: row.description ?? undefined,
  constructionSiteId: row.construction_site_id || null,
  employeeIds: row.lodging_employees?.map((r) => r.employee_id) || [],
  assignments:
    row.lodging_employees?.map((r) => ({
      employeeId: r.employee_id,
      startDate: r.start_date || row.start_date,
      endDate: r.end_date || row.end_date,
    })) || [],
});

export const mapToDbPayload = (data: Partial<Lodging>): Partial<LodgingDTO> => {
  const payload: Partial<LodgingDTO> = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.address !== undefined) payload.address = data.address;
  if (data.description !== undefined) payload.description = data.description;
  if (data.constructionSiteId !== undefined)
    payload.construction_site_id = data.constructionSiteId;
  if (data.startDate)
    payload.start_date = toSqlDate(data.startDate) ?? undefined;
  if (data.endDate) payload.end_date = toSqlDate(data.endDate) ?? undefined;

  return payload;
};

export const mapAssignmentsToRelations = (
  lodgingId: string,
  assignments: LodgingAssignment[]
): LodgingEmployeeDTO[] => {
  return assignments.map((assign) => ({
    lodging_id: lodgingId,
    employee_id: assign.employeeId,
    start_date: toSqlDate(assign.startDate) ?? null,
    end_date: toSqlDate(assign.endDate) ?? null,
  }));
};
