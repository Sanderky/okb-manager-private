import { supabase } from '../supabase';
import type { Vacation } from '../types';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import minMax from 'dayjs/plugin/minMax';

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
const toSqlDate = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

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

  await Promise.all([
    supabase
      .from('work_logs')
      .delete()
      .eq('employee_id', data.employeeId)
      .gte('date', startDateStr)
      .lte('date', endDateStr),

    supabase
      .from('daily_schedules')
      .delete()
      .eq('employee_id', data.employeeId)
      .gte('date', startDateStr)
      .lte('date', endDateStr),
  ]);

  return createdRecord.id;
};

export async function updateVacation(id: string, data: Partial<Vacation>) {
  const updatePayload: any = {};

  if (data.startDate) updatePayload.start_date = toSqlDate(data.startDate);
  if (data.endDate) updatePayload.end_date = toSqlDate(data.endDate);
  if (data.color) updatePayload.color = data.color;
  if (data.description) updatePayload.description = data.description;

  const { data: updatedRecord, error } = await supabase
    .from('vacations')
    .update(updatePayload)
    .eq('id', id)
    .select('employee_id, start_date, end_date')
    .single();

  if (error) throw error;

  if (data.startDate || data.endDate) {
    const startDateStr = updatedRecord.start_date;
    const endDateStr = updatedRecord.end_date;
    const employeeId = updatedRecord.employee_id;

    await Promise.all([
      supabase
        .from('work_logs')
        .delete()
        .eq('employee_id', employeeId)
        .gte('date', startDateStr)
        .lte('date', endDateStr),
      supabase
        .from('daily_schedules')
        .delete()
        .eq('employee_id', employeeId)
        .gte('date', startDateStr)
        .lte('date', endDateStr),
    ]);
  }
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

export const getUpcomingVacations = async (): Promise<Vacation[]> => {
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
    .order('start_date', { ascending: true });

  if (error) throw error;

  return data.map(mapVacationFromDB);
};

export const getUpcomingVacationsForEmployee = async (
  employeeId: string
): Promise<Vacation[]> => {
  const today = dayjs().format('YYYY-MM-DD');

  const { data, error } = await supabase
    .from('vacations')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('end_date', today)
    .order('start_date', { ascending: true });

  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    color: row.color,
    description: row.description,
    groupId: row.group_id,
  }));
};

export const removeEmployeeVacations = async (
  employeeId: string
): Promise<void> => {
  const { error } = await supabase
    .from('vacations')
    .delete()
    .eq('employee_id', employeeId);

  if (error) throw error;
};
