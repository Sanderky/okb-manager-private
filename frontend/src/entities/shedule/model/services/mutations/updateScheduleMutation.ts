import { saveScheduleList } from '@/entities/shedule/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateScheduleMutation = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: saveScheduleList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });

  return updateMutation;
};
