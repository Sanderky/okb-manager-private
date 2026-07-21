import type { Employee } from '@/entities/employee';
import dayjs from 'dayjs';
import type { EmployeeValidationErrors } from './types';

export const validate = (
  values: Partial<Omit<Employee, 'id'>>
): EmployeeValidationErrors => {
  const errors: EmployeeValidationErrors = {};

  if (!values.name) {
    errors.name = 'validation.nameRequired';
  } else if (values.name.length > 100) {
    errors.name = 'validation.nameTooLong';
  }

  if (values.email && !/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'validation.invalidEmail';
  }

  if (values.contractEndDate && !values.contractStartDate) {
    errors.contractStartDate = 'validation.contractStartDateRequired';
  }

  if (
    values.contractStartDate &&
    values.contractEndDate &&
    dayjs(values.contractEndDate).isBefore(dayjs(values.contractStartDate))
  ) {
    errors.contractEndDate = 'validation.contractEndDateBeforeStart';
  }

  if (values.a1EndDate && !values.a1StartDate) {
    errors.a1StartDate = 'validation.a1StartDateRequired';
  }

  if (
    values.a1StartDate &&
    values.a1EndDate &&
    dayjs(values.a1EndDate).isBefore(dayjs(values.a1StartDate))
  ) {
    errors.a1EndDate = 'validation.a1EndDateBeforeStart';
  }

  return errors;
};
