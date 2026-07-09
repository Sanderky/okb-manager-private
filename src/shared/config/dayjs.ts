import localizedFormat from 'dayjs/plugin/localizedFormat';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import 'dayjs/locale/de';
import 'dayjs/locale/en';

dayjs.extend(localizedFormat);
dayjs.extend(isBetween);
dayjs.extend(isoWeek);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export const setDayjsLocale = (locale: string) => {
  dayjs.locale(locale);
};
