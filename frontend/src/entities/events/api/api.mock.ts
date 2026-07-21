import { mockDb } from '@/shared/api/mock/mockDb';
import { delay } from '@/shared/lib/delay';
import dayjs from 'dayjs';
import { toSqlDate } from '@/shared/lib/date';
import {
  mapEventFromDB,
  mapToEventCreatePayload,
  mapToEventUpdatePayload,
} from './mappers';
import type { InfoEvent } from '../model/types';

const attachRelations = (event: any) => {
  const employees = mockDb.calendar_event_employees.filter(
    (e) => e.event_id === event.id
  );
  const constructions = mockDb.calendar_event_constructions.filter(
    (c) => c.event_id === event.id
  );

  return {
    ...event,
    calendar_event_employees: employees,
    calendar_event_constructions: constructions,
  };
};

export const createCalendarEvent = async (
  data: Partial<InfoEvent>
): Promise<string> => {
  await delay();
  if (!data.startDate || !data.endDate || !data.title) {
    throw new Error('Brak wymaganych danych (tytuł, data start/koniec)');
  }

  const payload = mapToEventCreatePayload(data);
  const eventId = crypto.randomUUID();

  const newEvent = { ...payload, id: eventId } as any;
  mockDb.calendar_events.push(newEvent);

  if (data.employeeIds && data.employeeIds.length > 0) {
    data.employeeIds.forEach((empId) => {
      mockDb.calendar_event_employees.push({
        event_id: eventId,
        employee_id: empId,
      });
    });
  }

  if (data.constructionIds && data.constructionIds.length > 0) {
    data.constructionIds.forEach((constId) => {
      mockDb.calendar_event_constructions.push({
        event_id: eventId,
        construction_id: constId,
      });
    });
  }

  return eventId;
};

export async function updateCalendarEvent(
  id: string,
  data: Partial<InfoEvent>
) {
  await delay();
  const updatePayload = mapToEventUpdatePayload(data);

  if (Object.keys(updatePayload).length > 0) {
    const index = mockDb.calendar_events.findIndex((e) => e.id === id);
    if (index !== -1) {
      mockDb.calendar_events[index] = {
        ...mockDb.calendar_events[index],
        ...updatePayload,
      } as any;
    }
  }

  if (data.employeeIds !== undefined) {
    mockDb.calendar_event_employees = mockDb.calendar_event_employees.filter(
      (e) => e.event_id !== id
    );
    data.employeeIds.forEach((empId) => {
      mockDb.calendar_event_employees.push({
        event_id: id,
        employee_id: empId,
      });
    });
  }

  if (data.constructionIds !== undefined) {
    mockDb.calendar_event_constructions =
      mockDb.calendar_event_constructions.filter((c) => c.event_id !== id);
    data.constructionIds.forEach((cId) => {
      mockDb.calendar_event_constructions.push({
        event_id: id,
        construction_id: cId,
      });
    });
  }
}

export async function removeCalendarEvent(id: string) {
  await delay();
  mockDb.calendar_events = mockDb.calendar_events.filter((e) => e.id !== id);
  mockDb.calendar_event_employees = mockDb.calendar_event_employees.filter(
    (e) => e.event_id !== id
  );
  mockDb.calendar_event_constructions =
    mockDb.calendar_event_constructions.filter((c) => c.event_id !== id);
}

export async function getCalendarEventsForMonths(
  monthKeys: string[]
): Promise<InfoEvent[]> {
  await delay();
  if (!monthKeys.length) return [];
  const sortedKeys = [...monthKeys].sort();
  const startMonth = sortedKeys[0];
  const endMonth = sortedKeys[sortedKeys.length - 1];

  const minDate = dayjs(startMonth).startOf('month').format('YYYY-MM-DD');
  const maxDate = dayjs(endMonth).endOf('month').format('YYYY-MM-DD');

  const filtered = mockDb.calendar_events.filter(
    (e) => e.start_date <= maxDate && e.end_date >= minDate
  );

  return filtered.map(attachRelations).map(mapEventFromDB);
}

export const getNearestUpcomingEvents = async (
  limit: number = 10
): Promise<InfoEvent[]> => {
  await delay();
  const todayStr = toSqlDate(new Date());
  if (!todayStr) return [];

  const filtered = mockDb.calendar_events.filter(
    (e) => e.start_date >= todayStr
  );
  filtered.sort((a, b) => a.start_date.localeCompare(b.start_date));

  return filtered.slice(0, limit).map(attachRelations).map(mapEventFromDB);
};

export const getUpcomingEventsForEmployee = async (
  employeeId: string,
  limit: number = 10
): Promise<InfoEvent[]> => {
  await delay();
  const todayStr = toSqlDate(new Date());
  if (!todayStr) return [];

  const employeeEventsIds = new Set(
    mockDb.calendar_event_employees
      .filter((e) => e.employee_id === employeeId)
      .map((e) => e.event_id)
  );

  const filtered = mockDb.calendar_events.filter(
    (e) => employeeEventsIds.has(e.id) && e.start_date >= todayStr
  );
  filtered.sort((a, b) => a.start_date.localeCompare(b.start_date));

  return filtered.slice(0, limit).map(attachRelations).map(mapEventFromDB);
};

export const getUpcomingEventsForConstruction = async (
  constructionId: string,
  limit: number = 10
): Promise<InfoEvent[]> => {
  await delay();
  const todayStr = toSqlDate(new Date());
  if (!todayStr) return [];

  const constructionEventsIds = new Set(
    mockDb.calendar_event_constructions
      .filter((c) => c.construction_id === constructionId)
      .map((c) => c.event_id)
  );

  const filtered = mockDb.calendar_events.filter(
    (e) => constructionEventsIds.has(e.id) && e.start_date >= todayStr
  );
  filtered.sort((a, b) => a.start_date.localeCompare(b.start_date));

  return filtered.slice(0, limit).map(attachRelations).map(mapEventFromDB);
};

export const getEventsForEmployee = async (
  employeeId: string
): Promise<InfoEvent[]> => {
  await delay();
  const employeeEventsIds = new Set(
    mockDb.calendar_event_employees
      .filter((e) => e.employee_id === employeeId)
      .map((e) => e.event_id)
  );

  const filtered = mockDb.calendar_events.filter((e) =>
    employeeEventsIds.has(e.id)
  );
  filtered.sort((a, b) => b.start_date.localeCompare(a.start_date));

  return filtered.map(attachRelations).map(mapEventFromDB);
};
