export interface ConstructionDTO {
  id: string;
  name: string;
  status: boolean;
  location: string | null;
  contractor_id?: string | null;
  contractors?: { name: string } | { name: string }[] | null;
  start_date: string;
  end_date: string | null;
  note?: string | null;
}
