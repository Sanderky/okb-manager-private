export interface ContractorDTO {
  id: string;
  name: string;
  note?: string | null;
  constructions?: { count: number }[] | null;
}
