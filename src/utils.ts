import dayjs, { Dayjs } from 'dayjs';

export const openGoogleMaps = (location: string | undefined | null) => {
  if (location) {
    const address = encodeURIComponent(location);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${address}`,
      '_blank'
    );
  }
};

export const toSqlDate = (
  date?: Date | string | Dayjs | null
): string | null => {
  if (!date) return null;
  return dayjs(date).format('YYYY-MM-DD');
};

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
