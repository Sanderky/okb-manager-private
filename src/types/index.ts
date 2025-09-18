type EndDateObject = {
  date: Date | null;
  permanent: boolean;
};

type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: boolean;
  note: string;
  contractStartDate: Date | null;
  contractEndDate?: EndDateObject;
  a1StartDate: Date | null;
  a1EndDate?: EndDateObject;
};

export type { Employee };

export interface Construction {
  id: string;
  name: string;
  location: string;
  contractor: string;
  startDate: Date;
  endDate?: EndDateObject;
  inProgress: boolean;
  note?: string;
}
