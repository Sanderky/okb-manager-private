import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase();
};

export const removePolishChars = (text: string): string => {
  return text
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

export const getDateStr = (
  start: Date | Dayjs | undefined,
  end: Date | Dayjs | undefined,
  showCount = false
) => {
  if (!start || !end) return '-';
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  const count = endDate.diff(startDate, 'day') + 1;
  if (startDate.isSame(endDate)) return startDate.format('DD.MM.YYYY');
  return `${startDate.format('DD.MM.YYYY')} - ${endDate.format('DD.MM.YYYY')}${showCount ? ` (${count} dni)` : ''}`;
};

export const getInitials = (name: string): string => {
  if (!name?.trim()) return '';
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return `${parts[0]?.charAt(0) ?? ''}.`.toUpperCase();
  }

  const first = parts[0]?.charAt(0) ?? '';
  const last = parts[parts.length - 1]?.charAt(0) ?? '';
  return `${first}. ${last}.`.toUpperCase();
};