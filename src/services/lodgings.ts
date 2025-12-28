import { supabase } from '../supabase';
import type { Lodging } from '../types';
import dayjs from 'dayjs';

const TABLE_NAME = 'lodgings';

const mapLodgingFromDB = (row: any): Lodging => ({
  id: row.id,
  name: row.name,
  address: row.address,
  startDate: new Date(row.start_date),
  endDate: new Date(row.end_date),
  employeeIds: row.employee_ids || [],
  description: row.description,
});

const toSqlDate = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const getLodgings = async (): Promise<Lodging[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
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
    employee_ids: data.employeeIds || [],
    description: data.description,
  };

  const { data: created, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return created.id;
};

export const updateLodging = async (id: string, data: Partial<Lodging>) => {
  const payload: any = {};
  if (data.name) payload.name = data.name;
  if (data.address) payload.address = data.address;
  if (data.startDate) payload.start_date = toSqlDate(data.startDate);
  if (data.endDate) payload.end_date = toSqlDate(data.endDate);
  if (data.employeeIds) payload.employee_ids = data.employeeIds;
  if (data.description !== undefined) payload.description = data.description;

  const { error } = await supabase
    .from(TABLE_NAME)
    .update(payload)
    .eq('id', id);

  if (error) throw error;
};

export const deleteLodging = async (id: string) => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
  if (error) throw error;
};
