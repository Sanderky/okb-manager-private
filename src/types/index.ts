export type EmployeeAttachmentType = 'id_card' | 'contract' | 'a1' | 'other';

export interface FileItem {
  id?: string;
  name: string;
  path: string;
  size: number;
  createdAt: string;
  type: 'file';
  contentType: string;
}

export interface FolderItem {
  name: string;
  type: 'folder';
  path: string;
}

export type FileBrowserItem = FileItem | FolderItem;

export interface Attachment extends FileItem {
  attachmentType: EmployeeAttachmentType;
}

export interface Employee {
  id: string;
  name: string;
  status: boolean;
  isContractor: boolean | null;
  pesel: string | null;
  birthDate: Date | null;
  address: string | null;
  hourRate: number | null;
  email: string | null;
  phone: string | null;
  birthPlace: string | null;
  accountNumber: string | null;
  note: string | null;
  contractStartDate: Date | null;
  contractEndDate: Date | null;
  contractISPermanent: boolean | null;
  a1StartDate: Date | null;
  a1EndDate: Date | null;
}
export interface Construction {
  id: string;
  name: string;
  status: boolean;
  location: string | null;
  contractor: string | null;
  contractorName?: string | null;
  startDate: Date;
  endDate: Date | null;
  note?: string | null;
}

export interface Contractor {
  id: string;
  name: string;
}

export interface Vacation {
  id?: string;
  employeeId: string;
  date: Date;
  yearMonth: string;
  groupId: string;
  startDate: Date;
  endDate: Date;
  color: string;
  description?: string;
}

export interface Schedule {
  id?: string;
  employeeId: string;
  constructions: (string | null)[];
  weekStart: Date;
}

export interface WorkHours {
  id: string;
  constructionId: string;
  employeeId: string;
  weekStart: Date;
  hours: number[];
}

export interface AlertsSettings {
  a1Warning: number;
  a1Critical: number;
  contractWarning: number;
  contractCritical: number;
}

export interface HomeDocument {
  id: string;
  note?: string;
}

export interface EmployeeAlert {
  id: string;
  employeeId: string;
  employeeName: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
}
