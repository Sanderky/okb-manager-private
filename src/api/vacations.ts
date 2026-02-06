import { supabase } from '../shared/api/supabase';
import type { Vacation } from '../shared/model/types';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import minMax from 'dayjs/plugin/minMax';
import { toSqlDate } from '../shared/lib/date';

dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(minMax);

const mapVacationFromDB = (row: any): Vacation => ({
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

export const createVacation = async (
  data: Partial<Vacation>
): Promise<string> => {
  if (!data.startDate || !data.endDate || !data.employeeId) {
    throw new Error('Brak wymaganych danych do utworzenia urlopu');
  }

  const startDateStr = toSqlDate(data.startDate);
  const endDateStr = toSqlDate(data.endDate);

  const payload = {
    employee_id: data.employeeId,
    start_date: startDateStr,
    end_date: endDateStr,
    color: data.color,
    description: data.description,
  };

  const { data: createdRecord, error } = await supabase
    .from('vacations')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;

  return createdRecord.id;
};

export async function updateVacation(id: string, data: Partial<Vacation>) {
  const updatePayload: any = {};

  if (data.startDate) updatePayload.start_date = toSqlDate(data.startDate);
  if (data.endDate) updatePayload.end_date = toSqlDate(data.endDate);
  if (data.color) updatePayload.color = data.color;
  if (data.description !== undefined)
    updatePayload.description = data.description;

  const { error } = await supabase
    .from('vacations')
    .update(updatePayload)
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
    .select(
      `
      *,
      employees ( name, status )
    `
    )
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
  const today = dayjs().format('YYYY-MM-DD');

  const { data, error } = await supabase
    .from('vacations')
    .select(
      `
      *,
      employees ( name, status )
    `
    )

    .gte('end_date', today)
    .order('start_date', { ascending: true })
    .limit(limit);

  if (error) throw error;

  return data.map(mapVacationFromDB);
};

export const getUpcomingVacationsForEmployee = async (
  employeeId: string,
  limit: number = 10
): Promise<Vacation[]> => {
  const today = dayjs().format('YYYY-MM-DD');

  const { data, error } = await supabase
    .from('vacations')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('end_date', today)
    .order('start_date', { ascending: true })
    .limit(limit);

  if (error) throw error;

  return data.map(
    (row) =>
      ({
        id: row.id,
        employeeId: row.employee_id,
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        color: row.color,
        description: row.description,
      }) as Vacation
  );
};
