import { useMutation } from '@tanstack/react-query';
import { ScheduleApi } from '@/entities/shedule';
import { getWeekDates } from '@/shared/lib/date';
import type { WorkHours, WeeklyTuple } from '../../types';

const fillWithSchedule = async (
  currentWeek: Date,
  isEmployeeOnVacation: (id: string, d: Date) => boolean
) => {
  const schedules = await ScheduleApi.getScheduleListForWeek(currentWeek);
  const newWh: WorkHours[] = [];
  const DEFAULT = 10;
  const DEFAULT_SATURDAY = 5;
  const dates = getWeekDates(currentWeek);

  schedules.forEach((grp) => {
    const cMap = new Map<string, number[]>();
    const cNames = new Map<string, { name: string; active: boolean }>();

    grp.constructions.forEach((c) => {
      if (!cMap.has(c.id)) {
        cMap.set(c.id, []);
        cNames.set(c.id, { name: c.name, active: c.active });
      }
      cMap.get(c.id)!.push(c.dayIndex);
    });

    cMap.forEach((days, cId) => {
      const h = Array(7).fill(null) as WeeklyTuple<number | null>;

      days.forEach((d) => {
        const isVacation = isEmployeeOnVacation(grp.employeeId, dates[d]);
        h[d] = isVacation ? 0 : d === 5 ? DEFAULT_SATURDAY : DEFAULT;
      });

      const cm = cNames.get(cId)!;
      newWh.push({
        id: `${cId}_${grp.employeeId}_${currentWeek.getTime()}`,
        constructionId: cId,
        employeeId: grp.employeeId,
        weekStart: currentWeek,
        hours: h,
        employeeName: grp.employeeName,
        employeeActive: grp.employeeActive,
        constructionName: cm.name,
        constructionActive: cm.active,
      });
    });
  });

  return newWh;
};

export const useFillWithSchedule = (
  currentWeek: Date,
  isEmployeeOnVacation: (id: string, d: Date) => boolean,
  onSuccessCallback?: (data: WorkHours[]) => void,
  onErrorCallback?: () => void
) => {
  return useMutation({
    mutationFn: () => fillWithSchedule(currentWeek, isEmployeeOnVacation),
    onSuccess: (data) => onSuccessCallback?.(data),
    onError: () => onErrorCallback?.(),
  });
};
