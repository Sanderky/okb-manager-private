import { mockDb } from '@/shared/api/mock/mockDb';
import type { Contractor } from '../model/types';
import { mapToContractor } from './mappers';
import { delay } from '@/shared/lib/delay';

export const getContractors = async (): Promise<Contractor[]> => {
  await delay();

  const sortedContractors = [...mockDb.contractors].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const withCounts = sortedContractors.map((contractor) => {
    const count = mockDb.constructions.filter(
      (c) => c.contractor_id === contractor.id
    ).length;

    return {
      ...contractor,
      constructions: [{ count }],
    };
  });

  return withCounts.map(mapToContractor);
};

export const addContractor = async (name: string): Promise<string> => {
  await delay();

  if (!name.trim()) {
    throw new Error('Nazwa kontrahenta jest wymagana');
  }

  const exists = mockDb.contractors.some(
    (c) => c.name.toLowerCase() === name.trim().toLowerCase()
  );
  if (exists) {
    throw new Error('Taki wykonawca już istnieje (błąd bazy danych)');
  }

  const newContractor = {
    id: crypto.randomUUID(),
    name: name.trim(),
    note: null,
  };

  mockDb.contractors.push(newContractor);

  return newContractor.id;
};

export const updateContractor = async (
  id: string,
  data: Partial<Contractor>
): Promise<void> => {
  await delay();

  const index = mockDb.contractors.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error(`Contractor with id ${id} not found`);
  }

  const payload: any = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.note !== undefined) payload.note = data.note;

  mockDb.contractors[index] = {
    ...mockDb.contractors[index],
    ...payload,
  };
};

export const deleteContractor = async (id: string): Promise<void> => {
  await delay();

  mockDb.contractors = mockDb.contractors.filter((c) => c.id !== id);
};
