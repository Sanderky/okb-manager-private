import type { Construction } from '@/entities/construction';

export type ValidationErrors = Partial<
  Record<keyof ConstructionFormState['values'], string>
>;

export interface ConstructionFormState {
  values: Partial<Omit<Construction, 'id'>>;
  errors: ValidationErrors;
}

export type FormFieldValue = string | Date | number | boolean | null;
