import { supabase } from '@/shared/api/supabase';
import dayjs from 'dayjs';
import { toSqlDate } from '@/shared/lib/date';
import type { ScheduleEntry } from '../model/types';

const mapToScheduleEntry = (row: any): ScheduleEntry => ({
  id: row.id,
  employeeId: row.employee_id,
  constructionId: row.construction_id,
  date: row.date,
  constructionName: row.constructions?.name,
  constructionActive: row.constructions?.status,
  employeeName: row.employees?.name,
  employeeActive: row.employees?.status,
});

export const getScheduleListForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<ScheduleEntry[]> => {
  const { data, error } = await supabase
    .from('daily_schedules')
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
  const startStr = dayjs(weekStart).format('YYYY-MM-DD');
  const endStr = dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD');

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

  const rows = data;

  const grouped = new Map<
    string,
    {
      employeeId: string;
      employeeName: string;
      employeeActive: boolean;
      constructions: Array<{
        id: string;
        name: string;
        active: boolean;
        dayIndex: number;
      }>;
    }
  >();

  rows.forEach((row: any) => {
    if (!grouped.has(row.employee_id)) {
      grouped.set(row.employee_id, {
        employeeId: row.employee_id,
        employeeName: row.employees?.name || 'Nieznany',
        employeeActive: row.employees?.status ?? false,
        constructions: [],
      });
    }

    const group = grouped.get(row.employee_id)!;
    const dayIndex = dayjs(row.date).diff(dayjs(weekStart), 'day');

    if (dayIndex >= 0 && dayIndex < 7) {
      group.constructions.push({
        id: row.construction_id,
        name: row.constructions?.name || 'Nieznana',
        active: row.constructions?.status ?? false,
        dayIndex,
      });
    }
  });

  return Array.from(grouped.values());
};
