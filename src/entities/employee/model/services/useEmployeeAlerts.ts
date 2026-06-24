import { useQuery } from '@tanstack/react-query';
import { getEmployeeAlerts } from '../../api/alerts';

export const useEmployeeAlerts = (enabled = true) => {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['alerts'],
    queryFn: getEmployeeAlerts,
    enabled,
  });
  return {
    alerts: data,
    isLoading,
    isError,
  };
};
