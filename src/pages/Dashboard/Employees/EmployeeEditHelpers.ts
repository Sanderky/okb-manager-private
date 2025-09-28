import dayjs from 'dayjs';
import type { Employee, FileItem } from '../../../types';
import type { EmployeeFormState } from './EmployeeForm';
import { forceDownloadFile } from '../../../components/fileBrowser/FileBrowserHelpers';

export const validate = (
  values: Partial<Omit<Employee, 'id'>>
): Partial<Record<keyof EmployeeFormState['values'], string>> => {
  const errors: Partial<Record<keyof EmployeeFormState['values'], string>> = {};

  if (!values.name) {
    errors.name = 'Imię jest wymagane.';
  }
  if (values.name && values.name.length > 100) {
    errors.name = 'Imię nie może być dłuższe niż 100 znaków.';
  }
  if (values.email && !/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Nieprawidłowy format adresu e-mail.';
  }

  if (values.contractEndDate?.date && !values.contractStartDate) {
    errors.contractStartDate =
      'Data rozpoczęcia jest wymagana, jeśli podano datę zakończenia.';
  }
  if (
    values.contractStartDate &&
    values.contractEndDate?.date &&
    dayjs(values.contractEndDate.date).isBefore(dayjs(values.contractStartDate))
  ) {
    errors.contractEndDate =
      'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.';
  }

  if (values.a1EndDate?.date && !values.a1StartDate) {
    errors.a1StartDate =
      'Data rozpoczęcia A1 jest wymagana, jeśli podano datę zakończenia A1.';
  }
  if (
    values.a1StartDate &&
    values.a1EndDate?.date &&
    dayjs(values.a1EndDate.date).isBefore(dayjs(values.a1StartDate))
  ) {
    errors.a1EndDate =
      'Data zakończenia A1 nie może być wcześniejsza niż data rozpoczęcia A1.';
  }

  return errors;
};

export const handleDownloadAttachment = async (file: FileItem | null) => {
  if (!file) return;
  try {
    forceDownloadFile(file.url, file.name);
  } catch (error) {
    console.error('Download error: ', error);
  }
};
