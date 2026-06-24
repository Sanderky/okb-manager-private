import { createCalendarEvent } from '../../../api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useAddEvent = () => {
  const queryClient = useQueryClient();
  const addMutation = useMutation({
    mutationFn: createCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
  });

  return addMutation;
};
