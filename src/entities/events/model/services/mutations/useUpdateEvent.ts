import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfoEvent } from '../../types';
import { updateCalendarEvent } from '../../../api';

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InfoEvent> }) =>
      updateCalendarEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
  });

  return updateMutation;
};
