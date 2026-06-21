import { supabase } from '@/shared/api/supabase';
import dayjs from 'dayjs';
import { toSqlDate } from '@/shared/lib/date';
import {
  mapEventFromDB,
  mapToEventCreatePayload,
  mapToEventUpdatePayload,
} from './mappers';
import type { InfoEvent } from '../model/types';

const TABLE_NAME = 'calendar_events';
const JOIN_EMPLOYEES_TABLE = 'calendar_event_employees';
const JOIN_CONSTRUCTIONS_TABLE = 'calendar_event_constructions';

const SELECT_QUERY = `
  *,
  calendar_event_employees ( employee_id ),
  calendar_event_constructions ( construction_id )
`;

export const createCalendarEvent = async (
  data: Partial<InfoEvent>
): Promise<string> => {
  if (!data.startDate || !data.endDate || !data.title) {
    throw new Error('Brak wymaganych danych (tytuł, data start/koniec)');
  }

  const payload = mapToEventCreatePayload(data);

  const { data: createdRecord, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  const eventId = createdRecord.id;

  const insertPromises = [];

  if (data.employeeIds && data.employeeIds.length > 0) {
    const employeeRows = data.employeeIds.map((empId) => ({
      event_id: eventId,
      employee_id: empId,
    }));
    insertPromises.push(
      supabase.from(JOIN_EMPLOYEES_TABLE).insert(employeeRows)
    );
  }

  if (data.constructionIds && data.constructionIds.length > 0) {
    const constructionRows = data.constructionIds.map((constId) => ({
      event_id: eventId,
      construction_id: constId,
    }));
    insertPromises.push(
      supabase.from(JOIN_CONSTRUCTIONS_TABLE).insert(constructionRows)
    );
  }

  if (insertPromises.length > 0) {
    const results = await Promise.all(insertPromises);
    results.forEach((result) => {
      if (result.error) throw result.error;
    });
  }

  return eventId;
};

export async function updateCalendarEvent(
  id: string,
  data: Partial<InfoEvent>
) {
  const updatePayload = mapToEventUpdatePayload(data);

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updatePayload)
      .eq('id', id);
    if (error) throw error;
  }

  const updatePromises = [];

  if (data.employeeIds !== undefined) {
    const updateEmployees = async () => {
      await supabase.from(JOIN_EMPLOYEES_TABLE).delete().eq('event_id', id);
      if (data.employeeIds!.length > 0) {
        const rows = data.employeeIds!.map((empId) => ({
          event_id: id,
          employee_id: empId,
        }));
        const { error } = await supabase
          .from(JOIN_EMPLOYEES_TABLE)
          .insert(rows);
        if (error) throw error;
      }
    };
    updatePromises.push(updateEmployees());
  }

  if (data.constructionIds !== undefined) {
    const updateConstructions = async () => {
      await supabase.from(JOIN_CONSTRUCTIONS_TABLE).delete().eq('event_id', id);
      if (data.constructionIds!.length > 0) {
        const rows = data.constructionIds!.map((cId) => ({
          event_id: id,
          construction_id: cId,
        }));
        const { error } = await supabase
          .from(JOIN_CONSTRUCTIONS_TABLE)
          .insert(rows);
        if (error) throw error;
      }
    };
    updatePromises.push(updateConstructions());
  }

  if (updatePromises.length > 0) {
    await Promise.all(updatePromises);
  }
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
    .select(SELECT_QUERY)
    .lte('start_date', maxDate)
    .gte('end_date', minDate);

  if (error) throw error;
  return data.map(mapEventFromDB);
}

export const getNearestUpcomingEvents = async (
  limit: number = 10
): Promise<InfoEvent[]> => {
  const todayStr = toSqlDate(new Date());

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(SELECT_QUERY)
    .gte('start_date', todayStr)
    .order('start_date', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data.map(mapEventFromDB);
};

export const getUpcomingEventsForEmployee = async (
  employeeId: string,
  limit: number = 10
): Promise<InfoEvent[]> => {
  const todayStr = toSqlDate(new Date());

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(
      `*, calendar_event_employees!inner(employee_id), calendar_event_constructions(construction_id)`
    )
    .eq('calendar_event_employees.employee_id', employeeId)
    .gte('start_date', todayStr)
    .order('start_date', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data.map(mapEventFromDB);
};

export const getUpcomingEventsForConstruction = async (
  constructionId: string,
  limit: number = 10
): Promise<InfoEvent[]> => {
  const todayStr = toSqlDate(new Date());

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(
      `*, calendar_event_employees(employee_id), calendar_event_constructions!inner(construction_id)`
    )
    .eq('calendar_event_constructions.construction_id', constructionId)
    .gte('start_date', todayStr)
    .order('start_date', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data.map(mapEventFromDB);
};

export const getEventsForEmployee = async (
  employeeId: string
): Promise<InfoEvent[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(
      `*, calendar_event_employees!inner(employee_id), calendar_event_constructions(construction_id)`
    )
    .eq('calendar_event_employees.employee_id', employeeId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data.map(mapEventFromDB);
};
