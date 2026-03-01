import type { IsoDateString } from '@/shared/model/types';

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

export interface ConstructionsWithWorkHours {
  id: string;
  name: string;
  isActive: boolean;
  workHours: {
    id: string;
    employeeId: string;
    employeeName: string;
    isActive: boolean;
    hours: (number | null)[];
    total: number;
    isOnVacation: boolean[];
  }[];
  totalHours: number;
}

export interface TableData {
  weekStart: Date;
  constructionsWithWorkHours: ConstructionsWithWorkHours[];
  weekDates: Date[];
  totalHoursData: { dailyTotals: number[]; grandTotal: number };
}
