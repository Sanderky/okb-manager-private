export interface Construction {
  id: string;
  name: string;
  status: boolean;
  location: string | null;

  contractorId?: string | null;
  contractorName?: string | null;

  startDate: Date;
  endDate: Date | null;
  note?: string | null;
}