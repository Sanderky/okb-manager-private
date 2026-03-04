import { toSqlDate } from '@/shared/lib/date';
import type { Lodging, LodgingAssignment } from '../model/types';

export type LodgingWithAssignments = Lodging & {
  assignments: LodgingAssignment[];
};

export const mapLodgingFromDB = (row: any): LodgingWithAssignments => ({
  id: row.id,
  name: row.name,
  address: row.address,
  startDate: new Date(row.start_date),
  endDate: new Date(row.end_date),
  description: row.description,
  constructionSiteId: row.construction_site_id || null,
  employeeIds: row.lodging_employees?.map((r: any) => r.employee_id) || [],
  assignments:
    row.lodging_employees?.map((r: any) => ({
      employeeId: r.employee_id,
      startDate: new Date(r.start_date || row.start_date),
      endDate: new Date(r.end_date || row.end_date),
    })) || [],
});

export const mapToLodgingCreatePayload = (data: Partial<Lodging>) => ({
  name: data.name || null,
  address: data.address || null,
  start_date: toSqlDate(data.startDate!),
  end_date: toSqlDate(data.endDate!),
  description: data.description || null,
  construction_site_id: data.constructionSiteId || null,
});

export const mapToLodgingUpdatePayload = (data: Partial<Lodging>) => {
  const payload: any = {};
  if (data.name) payload.name = data.name;
  if (data.address) payload.address = data.address;
  if (data.startDate) payload.start_date = toSqlDate(data.startDate);
  if (data.endDate) payload.end_date = toSqlDate(data.endDate);
  if (data.description !== undefined) payload.description = data.description;
  if (data.constructionSiteId !== undefined)
    payload.construction_site_id = data.constructionSiteId;
  return payload;
};

export const mapAssignmentsToRelations = (
  lodgingId: string,
  assignments: LodgingAssignment[]
) => {
  return assignments.map((assign) => ({
    lodging_id: lodgingId,
    employee_id: assign.employeeId,
    start_date: toSqlDate(assign.startDate),
    end_date: toSqlDate(assign.endDate),
  }));
};
