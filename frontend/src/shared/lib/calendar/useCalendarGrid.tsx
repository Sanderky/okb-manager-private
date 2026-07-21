import { useCallback, useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import type {
  BaseCalendarEvent,
  CalendarDay,
  GridEvent,
} from '@/shared/model/types';

export function useCalendarGrid<T extends BaseCalendarEvent>(
  currentMonth: Dayjs,
  events: T[]
) {
  const generateMonthGrid = useCallback(
    (month: Dayjs) => {
      const start = month.startOf('month').startOf('isoWeek');
      const end = month.endOf('month').endOf('isoWeek');
      const weeks: CalendarDay<T>[][] = [];
      let current = start.clone();

      const groupSlotMap: Record<string, number> = {};
      const activeSlots: Record<number, string> = {};

      const getFreeSlot = (): number => {
        let slot = 0;
        while (activeSlots[slot] !== undefined) slot++;
        return slot;
      };

      while (current.isSameOrBefore(end)) {
        const week: CalendarDay<T>[] = [];

        for (let i = 0; i < 7; i++) {
          const today = current.startOf('day');

          const dayEventsRaw = events.filter((ev) => {
            const vStart = dayjs(ev.startDate).startOf('day');
            const vEnd = dayjs(ev.endDate).endOf('day');
            return today.isSameOrAfter(vStart) && today.isSameOrBefore(vEnd);
          });

          const dayEvents: GridEvent<T>[] = dayEventsRaw.map((ev) => ({
            ...ev,
            date: today.clone(),
          }));

          dayEvents.sort((a, b) => {
            const durA = dayjs(a.endDate).diff(dayjs(a.startDate), 'day');
            const durB = dayjs(b.endDate).diff(dayjs(b.startDate), 'day');
            return durB - durA;
          });

          dayEvents.forEach((ev) => {
            const id = ev.id;
            if (groupSlotMap[id] === undefined) {
              const free = getFreeSlot();
              groupSlotMap[id] = free;
              activeSlots[free] = id;
            }
          });

          week.push({
            date: current.clone(),
            events: dayEvents,
            slots: { ...groupSlotMap },
          });

          dayEvents.forEach((ev) => {
            if (current.isSame(dayjs(ev.endDate), 'day')) {
              const id = ev.id;
              const slot = groupSlotMap[id];
              if (slot !== undefined) {
                delete activeSlots[slot];
              }
            }
          });

          current = current.add(1, 'day');
        }
        weeks.push(week);
      }
      return weeks;
    },
    [events]
  );

  const monthGrid = useMemo(
    () => generateMonthGrid(currentMonth),
    [currentMonth, generateMonthGrid]
  );

  return monthGrid;
}
