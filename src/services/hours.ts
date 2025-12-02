import { supabase } from '../supabase';
import type { WorkHours } from '../types';

const mapToWorkHours = (data: any): WorkHours => ({
  id: data.id,
  constructionId: data.construction_id,
  employeeId: data.employee_id,
  weekStart: new Date(data.week_start),
  hours: data.hours,
});

const toSqlDate = (date: Date) => date.toISOString();

export const getWorkHoursList = async (
  weekStart: Date
): Promise<WorkHours[]> => {
  const { data, error } = await supabase
    .from('work_hours')
    .select('*')
    .eq('week_start', toSqlDate(weekStart));

  if (error) throw error;
  return data.map(mapToWorkHours);
};

export const addWorkHours = async (
  workHours: Omit<WorkHours, 'id'>
): Promise<WorkHours> => {
  const payload = {
    construction_id: workHours.constructionId,
    employee_id: workHours.employeeId,
    week_start: toSqlDate(workHours.weekStart),
    hours: workHours.hours,
  };

  const { data, error } = await supabase
    .from('work_hours')
    .upsert(payload, { onConflict: 'construction_id, employee_id, week_start' })
    .select()
    .single();

  if (error) throw error;
  return mapToWorkHours(data);
};

export const updateWorkHours = async (workHours: WorkHours): Promise<void> => {
  const { error } = await supabase
    .from('work_hours')
    .update({
      hours: workHours.hours,
    })
    .eq('id', workHours.id);

  if (error) throw error;
};

export const deleteWorkHours = async (workHoursId: string): Promise<void> => {
  const { error } = await supabase
    .from('work_hours')
    .delete()
    .eq('id', workHoursId);

  if (error) throw error;
};

export const deleteConstructionWorkHours = async (
  constructionId: string,
  weekStart: Date
): Promise<void> => {
  const { error } = await supabase
    .from('work_hours')
    .delete()
    .eq('construction_id', constructionId)
    .eq('week_start', toSqlDate(weekStart));

  if (error) throw error;
};

export const removeWorkHoursByConstruction = async (
  constructionId: string
): Promise<void> => {
  const { error } = await supabase
    .from('constructions')
    .delete()
    .eq('id', constructionId);

  if (error) throw error;
};

export const removeEmployeeWorkHours = async (
  employeeId: string
): Promise<number> => {
  const { count, error } = await supabase
    .from('work_hours')
    .delete({ count: 'exact' })
    .eq('employee_id', employeeId);

  if (error) throw error;
  return count || 0;
};

export const deleteAllWorkHoursForWeek = async (
  weekStart: Date
): Promise<void> => {
  const { error } = await supabase
    .from('work_hours')
    .delete()
    .eq('week_start', toSqlDate(weekStart));

  if (error) throw error;
};

export const copyFromPreviousWeek = async (
  currentWeek: Date,
  previousWeek: Date
): Promise<void> => {
  const { error: deleteError } = await supabase
    .from('work_hours')
    .delete()
    .eq('week_start', toSqlDate(currentWeek));

  if (deleteError) throw deleteError;

  const { data: previousData, error: fetchError } = await supabase
    .from('work_hours')
    .select('*')
    .eq('week_start', toSqlDate(previousWeek));

  if (fetchError) throw fetchError;
  if (!previousData || previousData.length === 0) return;

  const newRecords = previousData.map((record) => ({
    construction_id: record.construction_id,
    employee_id: record.employee_id,
    hours: record.hours,
    week_start: toSqlDate(currentWeek),
  }));

  const { error: insertError } = await supabase
    .from('work_hours')
    .insert(newRecords);

  if (insertError) throw insertError;
};
