import dayjs from 'dayjs';
import { supabase } from '@/shared/api/supabase';
import { toSqlDate } from '@/shared/lib/date';
import type { Vacation } from '../model/types';
import { mapVacationFromDB, mapToVacationPayload } from './mappers';

export const createVacation = async (
  data: Partial<Vacation>
): Promise<string> => {
  if (!data.startDate || !data.endDate || !data.employeeId) {
    throw new Error('Brak wymaganych danych do utworzenia urlopu');
  }

  const payload = mapToVacationPayload(data);

  const { data: createdRecord, error } = await supabase
    .from('vacations')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return createdRecord.id;
};

export async function updateVacation(id: string, data: Partial<Vacation>) {
  const payload = mapToVacationPayload(data);

  const { error } = await supabase
    .from('vacations')
    .update(payload)
    .eq('id', id);

  if (error) throw error;
}

export async function removeVacation(id: string) {
  const { error } = await supabase.from('vacations').delete().eq('id', id);
  if (error) throw error;
}

export async function getVacationListForMonths(
  monthKeys: string[]
): Promise<Vacation[]> {
  if (!monthKeys.length) return [];

  const sortedKeys = [...monthKeys].sort();
  const startMonth = sortedKeys[0];
  const endMonth = sortedKeys[sortedKeys.length - 1];
  const minDate = dayjs(startMonth).startOf('month').format('YYYY-MM-DD');
  const maxDate = dayjs(endMonth).endOf('month').format('YYYY-MM-DD');

  const { data, error } = await supabase
    .from('vacations')
    .select(`*, employees ( name, status )`)
    .lte('start_date', maxDate)
    .gte('end_date', minDate);

  if (error) throw error;
  return data.map(mapVacationFromDB);
}

export const removeEmployeeVacations = async (
  employeeId: string
): Promise<void> => {
  const { error } = await supabase
    .from('vacations')
    .delete()
    .eq('employee_id', employeeId);
  if (error) throw error;
};

export const getUpcomingVacations = async (
  limit: number = 10
): Promise<Vacation[]> => {
  const todayStr = toSqlDate(new Date());

  const { data, error } = await supabase
    .from('vacations')
    .select(`*, employees ( name, status )`)
    .gte('end_date', todayStr)
    .order('start_date', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data.map(mapVacationFromDB);
};

export const getUpcomingVacationsForEmployee = async (
  employeeId: string,
  limit: number = 10
): Promise<Vacation[]> => {
  const todayStr = toSqlDate(new Date());

  const { data, error } = await supabase
    .from('vacations')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('end_date', todayStr)
    .order('start_date', { ascending: true })
    .limit(limit);

  if (error) throw error;

  return data.map(mapVacationFromDB);
};
