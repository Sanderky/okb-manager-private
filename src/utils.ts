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

export const toSqlDate = (date?: Date | string | Dayjs | null): string | null => {
  if (!date) return null;
  return dayjs(date).format('YYYY-MM-DD');
};
