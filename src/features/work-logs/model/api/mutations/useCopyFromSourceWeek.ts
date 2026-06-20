import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getWeekDates } from '@/shared/lib/date';
import type { WorkHours } from '../../types';
import { fetchWorkLogsForCopy } from '../../../api';

const copyFromSourceWeek = async (
  currentWeek: Date,
  sourceWeek: Date,
  isEmployeeOnVacation: (id: string, d: Date) => boolean
) => {
  const logs = await fetchWorkLogsForCopy(sourceWeek);
  const grouped = new Map<string, WorkHours>();
  const sDates = getWeekDates(sourceWeek);
  const targetDates = getWeekDates(currentWeek);

  logs.forEach((l) => {
    const k = `${l.constructionId}_${l.employeeId}`;
    if (!grouped.has(k)) {
      grouped.set(k, {
        id: `${l.constructionId}_${l.employeeId}_${currentWeek.getTime()}`,
        constructionId: l.constructionId,
        employeeId: l.employeeId,
        weekStart: currentWeek,
        hours: [null, null, null, null, null, null, null],
        employeeName: l.employeeName,
        employeeActive: l.employeeActive,
        constructionName: l.constructionName,
        constructionActive: l.constructionActive,
      });
    }

    const idx = sDates.findIndex(
      (d) =>
        dayjs(d).format('YYYY-MM-DD') === dayjs(l.date).format('YYYY-MM-DD')
    );

    if (idx !== -1) {
      const entry = grouped.get(k)!;
      const isTargetWeekVacation = isEmployeeOnVacation(
        l.employeeId,
        targetDates[idx]
      );

      entry.hours[idx] = isTargetWeekVacation ? 0 : l.hours;
    }
  });

  return Array.from(grouped.values());
};

export const useCopyFromSourceWeek = (
  currentWeek: Date,
  isEmployeeOnVacation: (id: string, d: Date) => boolean,
  onSuccessCallback?: (data: WorkHours[]) => void,
  onErrorCallback?: () => void
) => {
  return useMutation({
    mutationFn: (sourceWeek: Date) =>
      copyFromSourceWeek(currentWeek, sourceWeek, isEmployeeOnVacation),

    onSuccess: (data) => {
      onSuccessCallback?.(data);
    },
    onError: () => {
      onErrorCallback?.();
    },
  });
};
