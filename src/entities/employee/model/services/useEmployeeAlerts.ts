import { useQuery } from '@tanstack/react-query';
import { getEmployeeAlerts } from '../../api/alerts';

export const useEmployeeAlerts = () => {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['alerts'],
    queryFn: getEmployeeAlerts,
  });
  return {
    alerts: data,
    isLoading,
    isError,
  };
};
