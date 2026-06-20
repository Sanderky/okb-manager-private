import { saveScheduleList } from "@/entities/shedule/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// const updateScheduleMutation = useMutation({
//     mutationFn: ScheduleApi.saveScheduleList,
//     onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] }),
//     onError: () => notifications.show('Błąd zapisu', { severity: 'error' }),
//   });



  export const useUpdateScheduleMutation = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: saveScheduleList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  });

  return updateMutation;
};
