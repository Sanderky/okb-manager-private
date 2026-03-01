import type { IsoDateString } from '@/shared/model/types';

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

export type ScheduleMap = Record<IsoDateString, ScheduleEntry>;
