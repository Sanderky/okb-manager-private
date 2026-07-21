import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export const dateBetweenFilterFn = (
  row: any,
  columnId: string,
  filterValue: any
) => {
  if (!filterValue || !Array.isArray(filterValue)) return true;

  const [start, end] = filterValue;
  const rowValue = row.getValue(columnId);

  if (!rowValue) return false;

  const rowDate = dayjs.isDayjs(rowValue) ? rowValue : dayjs(rowValue);
  if (!rowDate.isValid()) return false;

  const startDate = start ? dayjs(start).startOf('day') : null;
  const endDate = end ? dayjs(end).endOf('day') : null;

  if (startDate && endDate) {
    return rowDate.isSameOrAfter(startDate) && rowDate.isSameOrBefore(endDate);
  } else if (startDate) {
    return rowDate.isSameOrAfter(startDate);
  } else if (endDate) {
    return rowDate.isSameOrBefore(endDate);
  }

  return true;
};

export const hourRateFilterFn = (
  row: any,
  columnId: string,
  filterValue: any
) => {
  if (!filterValue || typeof filterValue !== 'object') return true;

  const { min, max } = filterValue;
  const rowValue = row.getValue(columnId);
  const hourRate = rowValue || 0;

  if (min !== null && max !== null) {
    return hourRate >= min && hourRate <= max;
  } else if (min !== null) {
    return hourRate >= min;
  } else if (max !== null) {
    return hourRate <= max;
  }

  return true;
};
