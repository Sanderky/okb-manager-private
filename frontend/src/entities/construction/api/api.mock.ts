import { mockDb } from '@/shared/api/mock/mockDb';
import type { Construction } from '../model/types';
import { mapConstruction, mapToPayload } from './mappers';
import { delay } from '@/shared/lib/delay';

export async function createConstruction(
  data: Partial<Construction> & { name: string; startDate: Date }
): Promise<string> {
  await delay();

  if (!data.name || !data.startDate) {
    throw new Error('Nazwa i data rozpoczęcia są wymagane');
  }

  const payload = mapToPayload({
    status: true,
    ...data,
  });

  const id = crypto.randomUUID();

  const newRecord = { ...payload, id };
  mockDb.constructions.push(newRecord);

  return id;
}

export async function updateConstruction(
  id: string,
  data: Partial<Construction>
): Promise<void> {
  await delay();

  const payload = mapToPayload(data);
  const index = mockDb.constructions.findIndex((c) => c.id === id);

  if (index !== -1) {
    mockDb.constructions[index] = {
      ...mockDb.constructions[index],
      ...payload,
    };
  } else {
    throw new Error(`Construction with id ${id} not found`);
  }
}

export async function removeConstruction(id: string): Promise<void> {
  await delay();
  mockDb.constructions = mockDb.constructions.filter((c) => c.id !== id);
}

export async function getConstructionList(
  activeOnly = false
): Promise<Construction[]> {
  await delay();

  let filtered = [...mockDb.constructions];

  if (activeOnly) {
    filtered = filtered.filter((c) => c.status === true);
  }

  filtered.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status ? -1 : 1;
    }
    const nameA = a.name || '';
    const nameB = b.name || '';
    return nameA.localeCompare(nameB);
  });

  const withRelations = filtered.map((c) => {
    const contractor = mockDb.contractors.find(
      (cont) => cont.id === c.contractor_id
    );
    return {
      ...c,
      contractors: contractor ? { name: contractor.name } : null,
    };
  });

  return withRelations.map(mapConstruction);
}

export async function getConstruction(
  id: string
): Promise<Construction | null> {
  await delay();

  const record = mockDb.constructions.find((c) => c.id === id);

  if (!record) return null;

  const contractor = mockDb.contractors.find(
    (cont) => cont.id === record.contractor_id
  );
  const withRelation = {
    ...record,
    contractors: contractor ? { name: contractor.name } : null,
  };

  return mapConstruction(withRelation);
}

export async function getConstructionStats(): Promise<{
  total: number;
  active: number;
}> {
  await delay();

  const total = mockDb.constructions.length;
  const active = mockDb.constructions.filter((c) => c.status === true).length;

  return { total, active };
}
