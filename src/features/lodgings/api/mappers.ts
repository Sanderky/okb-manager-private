import { toSqlDate } from '@/shared/lib/date';
import type { Lodging, LodgingAssignment } from '../model/types';
import type { LodgingDTO, LodgingEmployeeDTO } from './types';

export type LodgingWithAssignments = Lodging & {
  assignments: LodgingAssignment[];
};

export const mapLodgingFromDB = (row: LodgingDTO): LodgingWithAssignments => ({
  id: row.id,
  name: row.name ?? undefined,
  address: row.address ?? undefined,
  startDate: new Date(row.start_date),
  endDate: new Date(row.end_date),
  description: row.description ?? undefined,
  constructionSiteId: row.construction_site_id || null,
  employeeIds: row.lodging_employees?.map((r) => r.employee_id) || [],
  assignments:
    row.lodging_employees?.map((r) => ({
      employeeId: r.employee_id,
      startDate: new Date(r.start_date || row.start_date),
      endDate: new Date(r.end_date || row.end_date),
    })) || [],
});

export const mapToLodgingCreatePayload = (data: Partial<Lodging>) => ({
  name: data.name || null,
  address: data.address || null,
  start_date: toSqlDate(data.startDate!) ?? '',
  end_date: toSqlDate(data.endDate!) ?? '',
  description: data.description || null,
  construction_site_id: data.constructionSiteId || null,
});

export const mapToLodgingUpdatePayload = (data: Partial<Lodging>) => {
  const payload: Partial<LodgingDTO> = {};

  if (data.name) payload.name = data.name;
  if (data.address) payload.address = data.address;
  if (data.startDate)
    payload.start_date = toSqlDate(data.startDate) ?? undefined;
  if (data.endDate) payload.end_date = toSqlDate(data.endDate) ?? undefined;
  if (data.description !== undefined)
    payload.description = data.description ?? null;
  if (data.constructionSiteId !== undefined)
    payload.construction_site_id = data.constructionSiteId ?? null;

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
