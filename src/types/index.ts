export type EmployeeAttachment =
  | 'idAttachment'
  | 'contractAttachment'
  | 'a1Attachment';

export type FileCustom = FileItem | FolderItem;

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
  a1Attachment: Attachment | null;
  contractAttachment: Attachment | null;
  idAttachment: Attachment | null;
}

export type EmployeeAlertSeverity = 'error' | 'warning' | 'info';

export interface EmployeeAlert {
  id: string;
  employeeId: string;
  employeeName: string;
  severity: EmployeeAlertSeverity;
  title: string;
  message: string;
}

export interface HomeDocument {
  id: string;
  note?: string;
}

export interface ConstructionContractor {
  id: string;
  name: string;
}
export interface Construction {
  id: string;
  name: string;
  status: boolean;
  location: string | null;
  contractor: string | null;
  startDate: Date;
  endDate: Date | null;
  note?: string | null;
}

export interface FileItem {
  name: string;
  type: 'file';
  fullPath: string;
  timeCreated?: string;
  size?: number;
  contentType?: string;
}

export interface Attachment extends FileItem {
  attachmentType: EmployeeAttachment;
}

export interface FolderItem {
  name: string;
  type: 'folder';
  fullPath: string;
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

export type File = FileItem | FolderItem;

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
