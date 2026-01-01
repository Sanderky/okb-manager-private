import { supabase } from '../supabase';
import type { Lodging } from '../types';
import { toSqlDate } from '../utils';

const TABLE_NAME = 'lodgings';
const JOIN_TABLE = 'lodging_employees';

const mapLodgingFromDB = (row: any): Lodging => ({
  id: row.id,
  name: row.name,
  address: row.address,
  startDate: new Date(row.start_date),
  endDate: new Date(row.end_date),
  employeeIds: row.lodging_employees?.map((r: any) => r.employee_id) || [],
  description: row.description,
});


export const getLodgings = async (): Promise<Lodging[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(
      `
      *,
      lodging_employees ( employee_id )
    `
    )
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data.map(mapLodgingFromDB);
};

export const createLodging = async (
  data: Partial<Lodging>
): Promise<string> => {
  const payload = {
    name: data.name,
    address: data.address,
    start_date: toSqlDate(data.startDate!),
    end_date: toSqlDate(data.endDate!),
    description: data.description,
  };

  const { data: created, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;

  if (data.employeeIds && data.employeeIds.length > 0) {
    const relations = data.employeeIds.map((empId) => ({
      lodging_id: created.id,
      employee_id: empId,
    }));

    const { error: relError } = await supabase
      .from(JOIN_TABLE)
      .insert(relations);

    if (relError) {
      console.error('Błąd przypisywania pracowników', relError);
    }
  }

  return created.id;
};

export const updateLodging = async (id: string, data: Partial<Lodging>) => {
  const payload: any = {};
  if (data.name) payload.name = data.name;
  if (data.address) payload.address = data.address;
  if (data.startDate) payload.start_date = toSqlDate(data.startDate);
  if (data.endDate) payload.end_date = toSqlDate(data.endDate);
  if (data.description !== undefined) payload.description = data.description;

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  }

  if (data.employeeIds !== undefined) {
    const { error: delError } = await supabase
      .from(JOIN_TABLE)
      .delete()
      .eq('lodging_id', id);

    if (delError) throw delError;

    if (data.employeeIds.length > 0) {
      const relations = data.employeeIds.map((empId) => ({
        lodging_id: id,
        employee_id: empId,
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
