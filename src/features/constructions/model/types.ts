import type { Construction } from '@/entities/construction';
import type { Dayjs } from 'dayjs';

export type ValidationErrors = Partial<
  Record<keyof ConstructionFormState['values'], string>
>;

export interface ConstructionFormState {
  values: Partial<Omit<Construction, 'id'>>;
  errors: ValidationErrors;
}

export type FormFieldValue = string | Date | number | boolean | null;

export interface ConstructionsFilters {
  name: string;
  contractor: string;
  location: string;
  startDateFrom: Dayjs | null;
  startDateTo: Dayjs | null;
  endDateFrom: Dayjs | null;
  endDateTo: Dayjs | null;
  status: string;
  employeeCountMin: string;
  employeeCountMax: string;
}
