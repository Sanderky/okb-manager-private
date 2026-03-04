import { supabase } from '@/shared/api/supabase';
import dayjs from 'dayjs';
import { toSqlDate } from '@/shared/lib/date';
import type { WorkLogEntry } from '../model/types';
import { mapToWorkLog, mapToWorkLogPayload } from './mappers';

const TABLE_NAME = 'work_logs';

const getWeekBoundaries = (weekStart: Date) => {
  return {
    startStr: toSqlDate(weekStart),
    endStr: toSqlDate(dayjs(weekStart).add(6, 'day').toDate()),
  };
};

export const getWorkLogs = async (
  startDate: Date,
  endDate: Date
): Promise<WorkLogEntry[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`*, employees ( name, status ), constructions ( name, status )`)
    .gte('date', toSqlDate(startDate))
    .lte('date', toSqlDate(endDate));

  if (error) throw error;
  return data.map(mapToWorkLog);
};

export const fetchWorkLogsForCopy = async (
  sourceWeekStart: Date
): Promise<WorkLogEntry[]> => {
  const { startStr, endStr } = getWeekBoundaries(sourceWeekStart);

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`*, employees ( name, status ), constructions ( name, status )`)
    .gte('date', startStr)
    .lte('date', endStr);

  if (error) throw error;
  return data.map(mapToWorkLog);
};

export const overrideWorkLogsForWeek = async (
  weekStart: Date,
  newLogs: Omit<WorkLogEntry, 'id'>[]
): Promise<void> => {
  const { startStr, endStr } = getWeekBoundaries(weekStart);

  const { error: deleteError } = await supabase
    .from(TABLE_NAME)
    .delete()
    .gte('date', startStr)
    .lte('date', endStr);

  if (deleteError) throw deleteError;

  if (newLogs.length > 0) {
    const payload = newLogs.map(mapToWorkLogPayload);

    const { error: insertError } = await supabase
      .from(TABLE_NAME)
      .insert(payload);

    if (insertError) throw insertError;
  }
};

export const deleteAllWorkHoursForWeek = async (
  weekStart: Date
): Promise<void> => {
  const { startStr, endStr } = getWeekBoundaries(weekStart);

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .gte('date', startStr)
    .lte('date', endStr);

  if (error) throw error;
};

export const saveWorkLogDay = async (
  employeeId: string,
  constructionId: string,
  date: Date,
  hours: number | null
): Promise<void> => {
  const dateStr = toSqlDate(date);

  const { error } = await supabase.from(TABLE_NAME).upsert(
    {
      employee_id: employeeId,
      construction_id: constructionId,
      date: dateStr,
      hours: hours,
    },
    { onConflict: 'employee_id, construction_id, date' }
  );

  if (error) throw error;
};
