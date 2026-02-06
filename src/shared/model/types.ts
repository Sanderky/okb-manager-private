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

export type IsoDateString = string;


export interface DiskUsage {
  total: number;
  free: number;
  used: number;
  percentage: number;
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

