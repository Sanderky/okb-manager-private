type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  hireDate: Date;
  contractEndDate?: Date;
};

export type { Employee };

export interface Construction {
  id: string;
  name: string;
  location: string;
  contractor: string;
  startDate: Date;
  endDate?: Date;
  inProgress: boolean;
  notes?: string;
}
