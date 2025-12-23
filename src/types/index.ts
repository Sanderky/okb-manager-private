export type IsoDateString = string;

export type EmployeeAttachmentType = 'id_card' | 'contract' | 'a1' | 'other';

export interface Contractor {
  id: string;
  name: string;
  note?: string;
  constructionsCount?: number;
}

export interface Construction {
  id: string;
  name: string;
  status: boolean;
  location: string | null;

  contractorId: string | null;
  contractorName?: string | null;

  startDate: Date;
  endDate: Date | null;
  note?: string | null;
}

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

export interface ScheduleEntry {
  id: string;
  employeeId: string;
  constructionId: string;
  date: string;

  constructionName?: string;
  constructionActive?: boolean;
  employeeName?: string;
  employeeActive?: boolean;
}

export interface WorkHours {
  id: string;
  constructionId: string;
  employeeId: string;
  weekStart: Date;
  hours: number[];
  total?: number;

  employeeName?: string;
  employeeActive?: boolean;

  constructionName?: string;
  constructionActive?: boolean;
}

export interface WorkLogEntry {
  id: string;
  employeeId: string;
  constructionId: string;
  date: string;
  hours: number;

  employeeName?: string;
  employeeActive?: boolean;
  constructionName?: string;
  constructionActive?: boolean;
}

export interface HoursRow {
  rowId: string;
  constructionId: string;
  constructionName: string;
  employeeId: string;
  employeeName: string;
  isActive: boolean;
  entries: Record<string, number>;
  total: number;
}

export type WorkLogMap = Record<IsoDateString, WorkLogEntry>;

export type ScheduleMap = Record<IsoDateString, ScheduleEntry>;

export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  createdAt: Date;
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
  employeeId: string;
}

export interface Vacation {
  id: string;
  employeeId: string;
  groupId?: string;
  startDate: Date;
  endDate: Date;
  color: string;
  description?: string;

  employeeName?: string;
  employeeActive?: boolean;
}

export type InfoEventSeverity =
  | 'info'
  | 'warning'
  | 'error'
  | 'success'
  | 'employee'
  | 'hotel'
  | 'other';

export interface InfoEvent {
  id: string;
  groupId?: string;
  title: string;
  startDate: Date;
  endDate: Date;
  severity: InfoEventSeverity;
  description?: string;
  employeeIds: string[];
  constructionIds: string[];
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

export interface HomeDocument {
  id: string;
  note: string;
}
