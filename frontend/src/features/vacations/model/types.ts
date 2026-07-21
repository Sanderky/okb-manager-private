import { Dayjs } from 'dayjs';

export interface CalendarEvent {
  id: string;
  employeeName: string;
  employeeId: string;
  employeeActive: boolean;
  startDate: Dayjs;
  endDate: Dayjs;
  date: Dayjs;
  // groupId: string;
  color: string;
  description?: string;
}

export interface CalendarGridProps {
  onMoreClick: (data: CalendarDay) => void;
  monthGrid: CalendarDay[][];
  currentMonth: Dayjs;
  selectDay: Dayjs | null;
  onDayClick: (day: Dayjs) => void;
  isDayInRange: (day: Dayjs) => boolean;
  handleEventClick: (event: CalendarEvent) => void;
}

export interface CalendarDay {
  date: Dayjs;
  events: CalendarEvent[];
  slots?: Record<string, number>;
}

export type ActiveDialog =
  | { type: 'none' }
  | { type: 'addEvent' }
  | { type: 'editEvent' }
  | { type: 'moreEvents'; day: CalendarDay };
