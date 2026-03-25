import type { Contractor } from '../model/types';
import type { ContractorDTO } from './types';

export const mapToContractor = (data: ContractorDTO): Contractor => {
  const count = data.constructions?.[0]?.count ?? 0;

  return {
    id: data.id,
    name: data.name,
    note: data.note || undefined,
    constructionsCount: count,
  };
};
