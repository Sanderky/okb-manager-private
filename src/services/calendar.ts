import { supabase } from '../supabase';
import type { InfoEvent, InfoEventSeverity } from '../types';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import minMax from 'dayjs/plugin/minMax';

dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(minMax);

const TABLE_NAME = 'calendar_events';

const mapEventFromDB = (row: any): InfoEvent => ({
  id: row.id,
  // Mapujemy tytuł z bazy
  title: row.title || 'Bez tytułu',
  startDate: new Date(row.start_date),
  endDate: new Date(row.end_date),
  severity: row.severity as InfoEventSeverity,
  description: row.description || '',
  groupId: row.group_id || row.id,

  employeeIds: row.employee_ids || [],
  constructionIds: row.construction_ids || [],
});

const toSqlDate = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const createCalendarEvent = async (
  data: Partial<InfoEvent>
): Promise<string> => {
  if (!data.startDate || !data.endDate || !data.severity || !data.title) {
    throw new Error('Brak wymaganych danych (tytuł, data, typ)');
  }

  const payload = {
    title: data.title,
    start_date: toSqlDate(data.startDate),
    end_date: toSqlDate(data.endDate),
    severity: data.severity,
    description: data.description,
    group_id: data.groupId,

    employee_ids: data.employeeIds || [],
    construction_ids: data.constructionIds || [],
  };

  const { data: createdRecord, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;

  return createdRecord.id;
};

export async function updateCalendarEvent(
  id: string,
  data: Partial<InfoEvent>
) {
  const updatePayload: any = {};

  if (data.title) updatePayload.title = data.title;
  if (data.startDate) updatePayload.start_date = toSqlDate(data.startDate);
  if (data.endDate) updatePayload.end_date = toSqlDate(data.endDate);
  if (data.severity) updatePayload.severity = data.severity;
  if (data.description !== undefined)
    updatePayload.description = data.description;
  if (data.groupId) updatePayload.group_id = data.groupId;

  if (data.employeeIds) updatePayload.employee_ids = data.employeeIds;
  if (data.constructionIds)
    updatePayload.construction_ids = data.constructionIds;

  const { error } = await supabase
    .from(TABLE_NAME)
    .update(updatePayload)
    .eq('id', id);

  if (error) throw error;
}

export async function removeCalendarEvent(id: string) {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
  if (error) throw error;
}

export async function getCalendarEventsForMonths(
  monthKeys: string[]
): Promise<InfoEvent[]> {
  if (!monthKeys.length) return [];

  const sortedKeys = [...monthKeys].sort();
  const startMonth = sortedKeys[0];
  const endMonth = sortedKeys[sortedKeys.length - 1];

  const minDate = dayjs(startMonth).startOf('month').format('YYYY-MM-DD');
  const maxDate = dayjs(endMonth).endOf('month').format('YYYY-MM-DD');

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .lte('start_date', maxDate)
    .gte('end_date', minDate);

  if (error) throw error;

  return data.map(mapEventFromDB);
}

export const getEventsForEmployee = async (
  employeeId: string
): Promise<InfoEvent[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .contains('employee_ids', [employeeId])
    .order('start_date', { ascending: false });

  if (error) throw error;

  return data.map(mapEventFromDB);
};
