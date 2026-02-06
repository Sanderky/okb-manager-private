import { supabase } from '../shared/api/supabase';
import type { WorkLogEntry } from '../shared/model/types';
import dayjs from 'dayjs';
import { toSqlDate } from '../shared/lib/date';

const mapToWorkLog = (row: any): WorkLogEntry => ({
  id: row.id,
  employeeId: row.employee_id,
  constructionId: row.construction_id,
  date: row.date,
  hours: row.hours === null ? null : Number(row.hours),

  employeeName: row.employees?.name,
  constructionName: row.constructions?.name,
  employeeActive: row.employees?.status,
  constructionActive: row.constructions?.status,
});

export const getWorkLogs = async (
  startDate: Date,
  endDate: Date
): Promise<WorkLogEntry[]> => {
  const { data, error } = await supabase
    .from('work_logs')
    .select(
      `
      *,
      employees ( name, status ),
      constructions ( name, status )
    `
    )
    .gte('date', toSqlDate(startDate))
    .lte('date', toSqlDate(endDate));

  if (error) throw error;
  return data.map(mapToWorkLog);
};

export const fetchWorkLogsForCopy = async (
  sourceWeekStart: Date
): Promise<WorkLogEntry[]> => {
  const startStr = toSqlDate(sourceWeekStart);
  const endStr = toSqlDate(dayjs(sourceWeekStart).add(6, 'day'));

  const { data, error } = await supabase
    .from('work_logs')
    .select(
      `
      *,
      employees ( name, status ),
      constructions ( name, status )
    `
    )
    .gte('date', startStr)
    .lte('date', endStr);

  if (error) throw error;
  return data.map(mapToWorkLog);
};

export const overrideWorkLogsForWeek = async (
  weekStart: Date,
  newLogs: Omit<WorkLogEntry, 'id'>[]
): Promise<void> => {
  const startStr = toSqlDate(weekStart);
  const endStr = toSqlDate(dayjs(weekStart).add(6, 'day'));

  const { error: deleteError } = await supabase
    .from('work_logs')
    .delete()
    .gte('date', startStr)
    .lte('date', endStr);

  if (deleteError) throw deleteError;

  if (newLogs.length > 0) {
    const payload = newLogs.map((log) => ({
      employee_id: log.employeeId,
      construction_id: log.constructionId,
      date: log.date,
      hours: log.hours,
    }));

    const { error: insertError } = await supabase
      .from('work_logs')
      .insert(payload);

    if (insertError) throw insertError;
  }
};

export const deleteAllWorkHoursForWeek = async (
  weekStart: Date
): Promise<void> => {
  const startStr = toSqlDate(weekStart);
  const endStr = toSqlDate(dayjs(weekStart).add(6, 'day'));

  const { error } = await supabase
    .from('work_logs')
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

  const { error } = await supabase.from('work_logs').upsert(
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
