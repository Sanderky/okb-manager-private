import { toSqlDate } from '@/shared/lib/date';
import type { Construction } from '../model/types';
import type { ConstructionDTO } from './types';

export const mapConstruction = (data: ConstructionDTO): Construction => {
  let extractedContractorName = null;

  if (Array.isArray(data.contractors)) {
    extractedContractorName = data.contractors[0]?.name || null;
  } else if (data.contractors) {
    extractedContractorName = data.contractors.name || null;
  }

  return {
    id: data.id,
    name: data.name,
    status: data.status,
    location: data.location || null,

    contractorId: data.contractor_id || null,
    contractorName: extractedContractorName,

    startDate: new Date(data.start_date),
    endDate: data.end_date ? new Date(data.end_date) : null,
    note: data.note || null,
  };
};

export const mapToPayload = (data: Partial<Construction>) => {
  const payload: any = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.status !== undefined) payload.status = data.status;
  if (data.location !== undefined) payload.location = data.location;
  if (data.contractorId !== undefined)
    payload.contractor_id = data.contractorId;
  if (data.note !== undefined) payload.note = data.note;

  if (data.startDate !== undefined)
    payload.start_date = toSqlDate(data.startDate);
  if (data.endDate !== undefined) payload.end_date = toSqlDate(data.endDate);

  return payload;
};
