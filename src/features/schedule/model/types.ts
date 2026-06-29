import type { ScheduleEntry } from '@/entities/shedule';
import type { Dayjs } from 'dayjs';

export interface ICell {
  date: Dayjs;
  weekKey: string;
  empId: string;
  isWeek: boolean;
}

export type ScheduleMap = Map<string, Map<string, ScheduleEntry>>;

export interface CellDisplayItem {
  id: string;
  text: string;
  isVacation: boolean;
  isActive: boolean;
}

export interface ScheduleEntryInput {
  employeeId: string;
  date: Date;
  constructionId: string | null;
}

export interface BuildEntriesResult {
  entriesToSave: ScheduleEntryInput[];
  notSavedDays: string[];
}