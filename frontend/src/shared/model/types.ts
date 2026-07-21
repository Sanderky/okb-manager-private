import type { Dayjs } from 'dayjs';

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

export interface FolderItem {
  name: string;
  type: 'folder';
  path: string;
  isSystem?: boolean;
}

export type FileBrowserItem = FileItem | FolderItem;

export type IsoDateString = string;

export interface BaseCalendarEvent {
  id: string;
  startDate: Dayjs | Date | string;
  endDate: Dayjs | Date | string;
}

export type GridEvent<T> = T & {
  date: Dayjs;
};

export interface CalendarDay<T extends BaseCalendarEvent> {
  date: Dayjs;
  events: GridEvent<T>[];
  slots: Record<string, number>;
}

export interface TranslationData {
  key: string;
  params?: Record<string, string | number>;
}
