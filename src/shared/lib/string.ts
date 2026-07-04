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
    .replace(/[^a-zA-Z0-9\s-]/g, '');
};

// export const getDateStr = (
//   start: Date | Dayjs | undefined,
//   end: Date | Dayjs | undefined,
//   showCount = false,
//   t: TFunction
// ) => {
//   if (!start || !end) return '-';
//   const startDate = dayjs(start);
//   const endDate = dayjs(end);
//   const count = endDate.diff(startDate, 'day') + 1;
//   if (startDate.isSame(endDate)) return startDate.format('DD.MM.YYYY');
//   return `${startDate.format('DD.MM.YYYY')} - ${endDate.format('DD.MM.YYYY')}${showCount ? ` (${count} dni)` : ''}`;
// };

export const getDateStr = (
  start: Date | Dayjs | undefined,
  end: Date | Dayjs | undefined,
  showCount = false,
  t: TFunction
) => {
  if (!start || !end) return '-';

  const startDate = dayjs(start);
  const endDate = dayjs(end);
  
  // Format 'L' automatycznie dopasuje się do języka (np. 15.08.2024 dla PL, 08/15/2024 dla EN)
  const startStr = startDate.format('L');

  // Sprawdzamy precyzyjnie co do dnia, żeby uniknąć błędów przy różnicach stref czasowych/godzin
  if (startDate.isSame(endDate, 'day')) {
    return startStr;
  }

  const endStr = endDate.format('L');
  const count = endDate.diff(startDate, 'day') + 1;
  
  // i18next samo ogarnie czy wstawić "1 dzień" czy "5 dni"
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
