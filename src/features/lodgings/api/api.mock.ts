import { mockDb } from '@/shared/api/mock/mockDb';

import { toSqlDate } from '@/shared/lib/date';
import type { Lodging, LodgingAssignment } from '../model/types';
import {
  mapLodgingFromDB,
  mapToLodgingCreatePayload,
  mapToLodgingUpdatePayload,
  mapAssignmentsToRelations,
  type LodgingWithAssignments,
} from './mappers';
import { delay } from '@/shared/lib/delay';

export const getLodgings = async (): Promise<LodgingWithAssignments[]> => {
  await delay();

  const sortedLodgings = [...mockDb.lodgings].sort((a, b) =>
    a.start_date.localeCompare(b.start_date)
  );

  const withRelations = sortedLodgings.map((lodging) => {
    const employees = mockDb.lodging_employees.filter(
      (le) => le.lodging_id === lodging.id
    );

    return {
      ...lodging,
      lodging_employees: employees,
    };
  });

  return withRelations.map(mapLodgingFromDB);
};

export const createLodging = async (
  data: Partial<Lodging> & { assignments?: LodgingAssignment[] }
): Promise<string> => {
  await delay();

  const payload = mapToLodgingCreatePayload(data);
  const newId = crypto.randomUUID();

  const newLodging = { ...payload, id: newId } as any;
  mockDb.lodgings.push(newLodging);

  if (data.assignments && data.assignments.length > 0) {
    const relations = mapAssignmentsToRelations(newId, data.assignments);
    mockDb.lodging_employees.push(...(relations as any[]));
  }

  return newId;
};

export const updateLodging = async (
  id: string,
  data: Partial<Lodging> & { assignments?: LodgingAssignment[] }
): Promise<void> => {
  await delay();

  const payload = mapToLodgingUpdatePayload(data);

  if (Object.keys(payload).length > 0) {
    const index = mockDb.lodgings.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Lodging with id ${id} not found`);
    mockDb.lodgings[index] = { ...mockDb.lodgings[index], ...payload } as any;
  }

  if (data.assignments !== undefined) {
    mockDb.lodging_employees = mockDb.lodging_employees.filter(
      (le) => le.lodging_id !== id
    );

    if (data.assignments.length > 0) {
      const relations = mapAssignmentsToRelations(id, data.assignments);
      mockDb.lodging_employees.push(...(relations as any[]));
    }
  }
};

export const deleteLodging = async (id: string): Promise<void> => {
  await delay();

  mockDb.lodgings = mockDb.lodgings.filter((l) => l.id !== id);
  mockDb.lodging_employees = mockDb.lodging_employees.filter(
    (le) => le.lodging_id !== id
  );
};

export const deleteOutdatedLodgings = async (): Promise<number> => {
  await delay();
  const today = toSqlDate(new Date());

  if (!today) return 0;

  const outdatedIds = new Set(
    mockDb.lodgings.filter((l) => l.end_date < today).map((l) => l.id)
  );

  const count = outdatedIds.size;

  if (count > 0) {
    mockDb.lodgings = mockDb.lodgings.filter((l) => !outdatedIds.has(l.id));
    mockDb.lodging_employees = mockDb.lodging_employees.filter(
      (le) => !outdatedIds.has(le.lodging_id)
    );
  }

  return count;
};
