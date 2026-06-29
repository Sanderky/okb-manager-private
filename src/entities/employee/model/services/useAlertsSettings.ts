import { useQuery } from '@tanstack/react-query';
import { fetchAlertsSettings } from '../../api/alerts';

export const useEmployeeAlertsSettings = (enabled = true) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['alertsSettings'],
    queryFn: fetchAlertsSettings,
    enabled: enabled,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
