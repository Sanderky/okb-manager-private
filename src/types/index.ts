export type IsoDateString = string;

export type EmployeeAttachmentType = 'id_card' | 'contract' | 'a1' | 'other';

export interface Contractor {
  id: string;
  name: string;
  note?: string;
  constructionsCount?: number;
}

export interface DiskUsage {
  total: number;
  free: number;
  used: number;
  percentage: number;
}
export interface TodoItem {
  id: number;
  title: string;
  is_completed: boolean;
  is_important: boolean;
  created_at: string;
  completed_at?: string | null;
}

export interface Construction {
  id: string;
  name: string;
  status: boolean;
  location: string | null;

  contractorId?: string | null;
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
  hours: (number | null)[];
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
  hours: number | null;

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
  isSystem?: boolean;
}

export interface FolderItem {
  name: string;
  type: 'folder';
  path: string;
  isSystem?: boolean;
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

export const SYSTEM_FOLDER_PREFIX = 'system-';

export const FOLDER_NAMES: Record<string, string> = {
  // Root folders
  employees: `${SYSTEM_FOLDER_PREFIX}employees`,
  constructions: `${SYSTEM_FOLDER_PREFIX}constructions`,

  // Attachments
  id_card: `${SYSTEM_FOLDER_PREFIX}id_card`,
  contract: `${SYSTEM_FOLDER_PREFIX}contract`,
  a1: `${SYSTEM_FOLDER_PREFIX}a1`,
  other: `${SYSTEM_FOLDER_PREFIX}other`,
};

export const FOLDER_TRANSLATIONS: Record<string, string> = {
  // Root folders
  [`${SYSTEM_FOLDER_PREFIX}employees`]: 'Pracownicy',
  [`${SYSTEM_FOLDER_PREFIX}constructions`]: 'Budowy',

  // Attachments
  [`${SYSTEM_FOLDER_PREFIX}id_card`]: 'Dowód osobisty',
  [`${SYSTEM_FOLDER_PREFIX}contract`]: 'Umowa',
  [`${SYSTEM_FOLDER_PREFIX}a1`]: 'Zaświadczenie A1',
  [`${SYSTEM_FOLDER_PREFIX}other`]: 'Inne dokumenty',
};
