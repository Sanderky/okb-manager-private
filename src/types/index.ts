export type EmployeeAttachment =
  | 'idAttachment'
  | 'contractAttachment'
  | 'a1Attachment';

export type FileCustom = FileItem | FolderItem;

export interface Employee {
  id: string;
  name: string;
  isContractor: boolean | null;
  pesel: string | null;
  birthDate: Date | null;
  address: string | null;
  hourRate: number | null;
  email: string | null;
  phone: string | null;
  status: boolean | null;
  note: string | null;
  contractStartDate: Date | null;
  contractEndDate: Date | null;
  contractISPermanent: boolean | null;
  a1StartDate: Date | null;
  a1EndDate: Date | null;
  a1Attachment: FileItem | null;
  contractAttachment: FileItem | null;
  idAttachment: FileItem | null;
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

export interface Construction {
  id: string;
  name: string;
  location: string | null;
  contractor: string | null;
  startDate: Date | null;
  endDate: Date | null;
  note?: string | null;
}

export interface FileItem {
  name: string;
  type: 'file';
  fullPath: string;
  url: string;
  timeCreated?: string;
  size?: number;
  contentType?: string;
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
}

// export interface Schedule {
//   id?: string;
//   employeeId: string;
//   constructions: (string | null)[];
//   weekStart: Timestamp;
// }

export interface Schedule {
  id?: string;
  employeeId: string;
  employeeName: string;
  constructions: ({
    constructionId: string;
    constructionName: string;
  } | null)[];
  weekStart: Date;
}

export type File = FileItem | FolderItem;

export interface WorkHours {
  id: string;
  constructionId: string;
  constructionName: string;
  employeeId: string;
  employeeName: string;
  weekStart: Date;
  hours: number[];
}
