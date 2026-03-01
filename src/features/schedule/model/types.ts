import type { ScheduleEntry } from '@/entities/shedule';
import type { Dayjs } from 'dayjs';

export interface ICell {
  date: Dayjs;
  weekKey: string;
  empId: string;
  isWeek: boolean;
}

export type ScheduleMap = Map<string, Map<string, ScheduleEntry>>;
