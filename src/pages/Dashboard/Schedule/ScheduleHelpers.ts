import dayjs, { Dayjs } from 'dayjs';
import type { ScheduleEntry } from '../../../types';

export const WEEK_DAYS = [
  'Pon.',
  'Wt.',
  'Śr.',
  'Czw.',
  'Pt.',
  'Sob.',
  'Niedz.',
];

export interface ICell {
  date: Dayjs;
  weekKey: string;
  empId: string;
  isWeek: boolean;
}

export type ScheduleMap = Map<string, Map<string, ScheduleEntry>>;

export const createScheduleMap = (schedules: ScheduleEntry[]): ScheduleMap => {
  const map = new Map<string, Map<string, ScheduleEntry>>();

  schedules.forEach((entry) => {
    if (!map.has(entry.employeeId)) {
      map.set(entry.employeeId, new Map());
    }

    map.get(entry.employeeId)!.set(entry.date, entry);
  });

  return map;
};

export const formatRange = (start: dayjs.Dayjs, end: dayjs.Dayjs) => {
  const sameDay = start.isSame(end, 'day');
  const sameMonth = start.month() === end.month();
  if (sameDay) return start.format('DD.MM');
  if (sameMonth) return `${start.format('DD')}-${end.format('DD.MM')}`;
  return `${start.format('DD.MM')}-${end.format('DD.MM')}`;
};

export const daysToRanges = (days: dayjs.Dayjs[]) => {
  if (days.length === 0) return [];
  const sorted = [...days].sort((a, b) => a.valueOf() - b.valueOf());
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].diff(end, 'day') === 1) {
      end = sorted[i];
    } else {
      ranges.push(formatRange(start, end));
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(formatRange(start, end));
  return ranges;
};
