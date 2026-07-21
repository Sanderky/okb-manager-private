import { updateAlertsSettings } from '../../../api/alerts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateEmployeeAlertsSettings = () => {
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: updateAlertsSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertsSettings'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
  return updateMutation;
};
