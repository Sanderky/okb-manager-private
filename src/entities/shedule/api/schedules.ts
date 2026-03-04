import { supabase } from '@/shared/api/supabase';
import dayjs from 'dayjs';
import { toSqlDate } from '@/shared/lib/date';
import type { ScheduleEntry } from '../model/types';
import { mapToScheduleEntry, mapWeeklySchedulesToDomain } from './mappers';

export const getScheduleListForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<ScheduleEntry[]> => {
  const { data, error } = await supabase
    .from('daily_schedules')
    .select(`*, employees ( name, status ), constructions ( name, status )`)
    .gte('date', toSqlDate(startDate))
    .lte('date', toSqlDate(endDate));

  if (error) throw error;
  return data.map(mapToScheduleEntry);
};

export const saveScheduleList = async (
  entries: { employeeId: string; date: Date; constructionId: string | null }[]
): Promise<void> => {
  if (entries.length === 0) return;

  const upserts = entries
    .filter((e) => e.constructionId !== null)
    .map((e) => ({
      employee_id: e.employeeId,
      construction_id: e.constructionId,
      date: toSqlDate(e.date),
    }));

  const deletes = entries.filter((e) => e.constructionId === null);

  if (upserts.length > 0) {
    const { error } = await supabase
      .from('daily_schedules')
      .upsert(upserts, { onConflict: 'employee_id, date' });
    if (error) throw error;
  }

  if (deletes.length > 0) {
    const deletePromises = deletes.map((d) =>
      supabase
        .from('daily_schedules')
        .delete()
        .eq('employee_id', d.employeeId)
        .eq('date', toSqlDate(d.date))
    );
    await Promise.all(deletePromises);
  }
};

export const saveScheduleDay = async (
  employeeId: string,
  date: Date,
  constructionId: string | null
): Promise<void> => {
  const dateStr = toSqlDate(date);

  if (constructionId) {
    const { error } = await supabase.from('daily_schedules').upsert(
      {
        employee_id: employeeId,
        construction_id: constructionId,
        date: dateStr,
      },
      { onConflict: 'employee_id, date' }
    );
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('daily_schedules')
      .delete()
      .eq('employee_id', employeeId)
      .eq('date', dateStr);

    if (error) throw error;
  }
};

export const removeEmployeeSchedules = async (
  employeeId: string
): Promise<void> => {
  const { error } = await supabase
    .from('daily_schedules')
    .delete()
    .eq('employee_id', employeeId);

  if (error) throw error;
};

export const getScheduleListForWeek = async (weekStart: Date) => {
  const startStr = toSqlDate(weekStart);
  const endStr = toSqlDate(dayjs(weekStart).add(6, 'day').toDate());

  const { data, error } = await supabase
    .from('daily_schedules')
    .select(
      `
      id,
      employee_id,
      construction_id,
      date,
      employees ( name, status ),
      constructions ( name, status )
    `
    )
    .gte('date', startStr)
    .lte('date', endStr);

  if (error) throw error;

  return mapWeeklySchedulesToDomain(data, weekStart);
};
