import dayjs from 'dayjs';
import type { Employee, FileItem } from '../../../types';
import type { EmployeeFormState } from './EmployeeForm';
import { forceDownloadFile } from '../../../components/fileBrowser/FileBrowserHelpers';

export const sortEmployees = (employees: Employee[]): Employee[] => {
  return [...employees].sort((a, b) => {
    const getLastFirstName = (fullName: string) => {
      const parts = fullName.trim().split(/\s+/);

      if (parts.length === 1) {
        return [parts[0].toLowerCase(), ''];
      } else {
        const lastName = parts.pop()!;
        const firstName = parts.join(' ');
        return [lastName.toLowerCase(), firstName.toLowerCase()];
      }
    };

    const [aLastName, aFirstName] = getLastFirstName(a.name);
    const [bLastName, bFirstName] = getLastFirstName(b.name);

    if (aLastName < bLastName) return -1;
    if (aLastName > bLastName) return 1;

    if (aFirstName < bFirstName) return -1;
    if (aFirstName > bFirstName) return 1;

    return 0;
  });
};

export const validate = (
  values: Partial<Omit<Employee, 'id'>>
): Partial<Record<keyof EmployeeFormState['values'], string>> => {
  const errors: Partial<Record<keyof EmployeeFormState['values'], string>> = {};

  if (!values.name) {
    errors.name = 'Imię jest wymagane.';
  } else if (values.name.length > 100) {
    errors.name = 'Imię nie może być dłuższe niż 100 znaków.';
  }

  if (values.email && !/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Nieprawidłowy format adresu e-mail.';
  }

  if (values.contractEndDate && !values.contractStartDate) {
    errors.contractStartDate =
      'Data rozpoczęcia jest wymagana, jeśli podano datę zakończenia.';
  }

  if (
    values.contractStartDate &&
    values.contractEndDate &&
    dayjs(values.contractEndDate).isBefore(dayjs(values.contractStartDate))
  ) {
    errors.contractEndDate =
      'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.';
  }

  if (values.a1EndDate && !values.a1StartDate) {
    errors.a1StartDate =
      'Data rozpoczęcia A1 jest wymagana, jeśli podano datę zakończenia A1.';
  }
  if (
    values.a1StartDate &&
    values.a1EndDate &&
    dayjs(values.a1EndDate).isBefore(dayjs(values.a1StartDate))
  ) {
    errors.a1EndDate =
      'Data zakończenia A1 nie może być wcześniejsza niż data rozpoczęcia A1.';
  }

  return errors;
};

export const handleDownloadAttachment = async (file: FileItem | null) => {
  if (!file) return;
  try {
    forceDownloadFile(file.fullPath, file.name);
  } catch (error) {
    console.error('Download error: ', error);
  }
};
