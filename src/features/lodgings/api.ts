import { supabase } from '../../shared/api/supabase';
import type { Lodging, LodgingAssignment } from './types';
import { toSqlDate } from '../../shared/lib/date';

const TABLE_NAME = 'lodgings';
const JOIN_TABLE = 'lodging_employees';

const mapLodgingFromDB = (
  row: any
): Lodging & { assignments: LodgingAssignment[] } => ({
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

export const getLodgings = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(
      `
      *,
      lodging_employees ( employee_id, start_date, end_date )
    `
    )
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data.map(mapLodgingFromDB);
};

export const createLodging = async (
  data: Partial<Lodging> & { assignments?: LodgingAssignment[] }
): Promise<string> => {
  const payload = {
    name: data.name || null,
    address: data.address || null,
    start_date: toSqlDate(data.startDate!),
    end_date: toSqlDate(data.endDate!),
    description: data.description || null,
    construction_site_id: data.constructionSiteId || null,
  };

  const { data: created, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;

  if (data.assignments && data.assignments.length > 0) {
    const relations = data.assignments.map((assign) => ({
      lodging_id: created.id,
      employee_id: assign.employeeId,
      start_date: toSqlDate(assign.startDate),
      end_date: toSqlDate(assign.endDate),
    }));

    const { error: relError } = await supabase
      .from(JOIN_TABLE)
      .insert(relations);

    if (relError) console.error('Błąd przypisywania', relError);
  }

  return created.id;
};

export const updateLodging = async (
  id: string,
  data: Partial<Lodging> & { assignments?: LodgingAssignment[] }
) => {
  const payload: any = {};
  if (data.name) payload.name = data.name;
  if (data.address) payload.address = data.address;
  if (data.startDate) payload.start_date = toSqlDate(data.startDate);
  if (data.endDate) payload.end_date = toSqlDate(data.endDate);
  if (data.description !== undefined) payload.description = data.description;
  if (data.constructionSiteId !== undefined)
    payload.construction_site_id = data.constructionSiteId;

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  }

  if (data.assignments !== undefined) {
    const { error: delError } = await supabase
      .from(JOIN_TABLE)
      .delete()
      .eq('lodging_id', id);
    if (delError) throw delError;

    if (data.assignments.length > 0) {
      const relations = data.assignments.map((assign) => ({
        lodging_id: id,
        employee_id: assign.employeeId,
        start_date: toSqlDate(assign.startDate),
        end_date: toSqlDate(assign.endDate),
      }));

      const { error: insError } = await supabase
        .from(JOIN_TABLE)
        .insert(relations);
      if (insError) throw insError;
    }
  }
};

export const deleteLodging = async (id: string) => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
  if (error) throw error;
};

export const deleteOutdatedLodgings = async () => {
  const today = toSqlDate(new Date());

  const { error, count } = await supabase
    .from(TABLE_NAME)
    .delete({ count: 'exact' })
    .lt('end_date', today);

  if (error) throw error;
  return count || 0;
};
