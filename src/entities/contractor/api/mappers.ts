import type { Contractor } from "../model/types";

export const mapToContractor = (data: any): Contractor => ({
  id: data.id,
  name: data.name,
  note: data.note || null,
  constructionsCount: data?.constructions[0]?.count
});