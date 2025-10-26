import { Timestamp } from 'firebase/firestore';
import dayjs, { Dayjs } from 'dayjs';
import type { Schedule } from '../../../types';

export const getScheduleByEmployeeAndWeek = (
  schedules: Schedule[],
  employeeId: string,
  weekStart: Date
): Schedule | null => {
  const weekStartTimestamp = Timestamp.fromDate(weekStart);

  const foundSchedule = schedules.find(
    (schedule) =>
      schedule.employeeId === employeeId &&
      schedule.weekStart.isEqual(weekStartTimestamp)
  );

  return foundSchedule || null;
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

export interface ICell {
  date: Dayjs;
  weekKey: string;
  empId: string;
  isWeek: boolean;
}
