import dayjs from 'dayjs';
import type { Lodging } from '../types';

export const getEmployeeLabel = (
  employeeName: string,
  lodging: Lodging,
  employeeId: string
) => {
  const assignment = lodging.assignments?.find(
    (a) => a.employeeId === employeeId
  );

  if (!assignment) return employeeName;

  const lStart = dayjs(lodging.startDate);
  const lEnd = dayjs(lodging.endDate);
  const aStart = dayjs(assignment.startDate);
  const aEnd = dayjs(assignment.endDate);

  const isStartSame = lStart.isSame(aStart, 'day');
  const isEndSame = lEnd.isSame(aEnd, 'day');

  if (isStartSame && isEndSame) {
    return employeeName;
  }

  let dateInfo = '';
  if (!isStartSame && !isEndSame) {
    dateInfo = `${aStart.format('DD.MM')} - ${aEnd.format('DD.MM')}`;
  } else if (!isStartSame) {
    dateInfo = `od ${aStart.format('DD.MM')}`;
  } else if (!isEndSame) {
    dateInfo = `do ${aEnd.format('DD.MM')}`;
  }

  return `${employeeName} | ${dateInfo}`;
};
