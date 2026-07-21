import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { TFunction } from 'i18next';

export const normalizeToEnglishAlphabet = (text: string): string => {
  const specialChars: Record<string, string> = {
    ł: 'l',
    Ł: 'L',
    ß: 'ss',
    æ: 'ae',
    Æ: 'AE',
    œ: 'oe',
    Œ: 'OE',
    ø: 'o',
    Ø: 'O',
    đ: 'd',
    Đ: 'D',
  };

  return text
    .replace(/[łŁßæÆœŒøØđĐ]/g, (match) => specialChars[match] || match)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s._-]/g, '');
};

export const getDateStr = (
  start: Date | Dayjs | undefined,
  end: Date | Dayjs | undefined,
  showCount = false,
  t: TFunction
) => {
  if (!start || !end) return '-';

  const startDate = dayjs(start);
  const endDate = dayjs(end);

  const startStr = startDate.format('L');
  if (startDate.isSame(endDate, 'day')) {
    return startStr;
  }

  const endStr = endDate.format('L');
  const count = endDate.diff(startDate, 'day') + 1;
  const countStr = showCount ? ` (${t('common:date.days', { count })})` : '';

  return `${startStr} - ${endStr}${countStr}`;
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
