import type { Construction } from '@/entities/construction';
import type { Dayjs } from 'dayjs';

export interface LodgingAssignment {
  employeeId: string;
  startDate: Date | string;
  endDate: Date | string;
}

export interface Lodging {
  id: string;
  name?: string;
  address?: string;
  description?: string;
  startDate: Date | string;
  endDate: Date | string;
  constructionSiteId?: string | null;
  employeeIds: string[];
  assignments?: LodgingAssignment[];
}

export interface LocalAssignment {
  employeeId: string;
  startDate: Dayjs;
  endDate: Dayjs;
}

export interface TimelineRow {
  construction:
    | Construction
    | { id: string; name: string; location: null; status: boolean };
  lodgings: (Lodging & { lane: number })[];
  height: number;
}

export interface TimelineData {
  minDate: Dayjs;
  maxDate: Dayjs;
  totalDays: number;
  daysArray: Dayjs[];
  rows: TimelineRow[];
}

export type ViewMode = 'grid' | 'timeline';
