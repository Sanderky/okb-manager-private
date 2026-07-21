import { useQuery } from '@tanstack/react-query';
import { getEmployeeAlerts } from '../../api/alerts';
import type { EmployeeAlert } from '../types';

const getSortValue = (alert: EmployeeAlert) => {
  if (typeof alert.daysLeft === 'number') {
    return alert.daysLeft;
  }

  const dateStr = alert.messageData?.params?.date;
  if (typeof dateStr === 'string') {
    const [day, month, year] = dateStr.split('.');
    if (day && month && year) {
      return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
    }
  }

  return Infinity;
};

export const useEmployeeAlerts = (enabled = true) => {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['alerts'],
    queryFn: getEmployeeAlerts,
    enabled,
    select: (rawAlerts: EmployeeAlert[]) => {
      return [...rawAlerts].sort((a, b) => {
        if (a.severity === 'error' && b.severity !== 'error') return -1;
        if (a.severity !== 'error' && b.severity === 'error') return 1;

        const valA = getSortValue(a);
        const valB = getSortValue(b);

        if (valA === valB) return 0;
        return valA < valB ? -1 : 1;
      });
    },
  });
  return {
    alerts: data,
    isLoading,
    isError,
  };
};
