import type { FileItem } from '@/shared/model/types';

export type EmployeeAttachmentType = 'id_card' | 'contract' | 'a1' | 'other';

export interface Employee {
  id: string;
  name: string;
  status: boolean;
  isContractor: boolean;

  pesel: string | null;
  birthDate: Date | null;
  birthPlace: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;

  hourRate: number | null;
  accountNumber: string | null;

  contractStartDate: Date | null;
  contractEndDate: Date | null;
  contractIsPermanent: boolean | null;

  a1StartDate: Date | null;
  a1EndDate: Date | null;

  note: string | null;
}

export interface Attachment extends FileItem {
  attachmentType: EmployeeAttachmentType;
  employeeId: string;
}

export interface EmployeeAlert {
  id: string;
  employeeId: string;
  employeeName: string;
  severity: 'error' | 'warning';
  title: string;
  message: string;
  daysLeft?: number;
}

export interface AlertsSettings {
  a1Warning: number;
  a1Critical: number;
  contractWarning: number;
  contractCritical: number;
}
