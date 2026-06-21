import type { Employee } from '@/entities/employee';
import type { Dayjs } from 'dayjs';

export interface FieldInfo {
  key: keyof Employee;
  label: string;
}

export interface EmployeesFilters {
  name: string;
  email: string;
  phone: string;
  address: string;
  pesel: string;
  birthPlace: string;
  hourRateFrom: string;
  hourRateTo: string;
  birthDateFrom: Dayjs | null;
  birthDateTo: Dayjs | null;
  isContractor: string;
  contractStartDateFrom: Dayjs | null;
  contractStartDateTo: Dayjs | null;
  contractEndDateFrom: Dayjs | null;
  contractEndDateTo: Dayjs | null;
  a1StartDateFrom: Dayjs | null;
  a1StartDateTo: Dayjs | null;
  a1EndDateFrom: Dayjs | null;
  a1EndDateTo: Dayjs | null;
  status: string;
}
