import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeCalendarEvent } from '../../../api';

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: removeCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
  });

  return deleteMutation;
};
