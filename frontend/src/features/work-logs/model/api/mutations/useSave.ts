import { useMutation, useQueryClient } from '@tanstack/react-query';
import { overrideWorkLogsForWeek } from '../../../api';
import { flattenWorkHoursToLogs } from '../../utils/hoursTableUtils';
import type { WorkHours } from '../../types';

export const useSaveWorkLogs = (
  onSuccessCallback?: () => void,
  onErrorCallback?: () => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workHours,
      currentWeek,
    }: {
      workHours: WorkHours[];
      currentWeek: Date;
    }) => {
      const logs = flattenWorkHoursToLogs(workHours, currentWeek);
      await overrideWorkLogsForWeek(currentWeek, logs);
      return currentWeek;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workLogs'],
      });

      queryClient.invalidateQueries({
        queryKey: ['weekReportData'],
      });
      onSuccessCallback?.();
    },
    onError: () => {
      onErrorCallback?.();
    },
  });
};
