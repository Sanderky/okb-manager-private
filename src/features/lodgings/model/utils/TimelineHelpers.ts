import dayjs from 'dayjs';
import type { Lodging } from '../types';

export const calculateLanes = (lodgings: Lodging[]) => {
  if (!lodgings.length) return { items: [], maxLanes: 0 };

  const sorted = [...lodgings].sort(
    (a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
  );

  const lanesEndDates: number[] = [];

  const itemsWithLanes = sorted.map((item) => {
    const itemStart = dayjs(item.startDate).valueOf();
    const itemEnd = dayjs(item.endDate).valueOf();

    let laneIndex = -1;

    for (let i = 0; i < lanesEndDates.length; i++) {
      if (itemStart > lanesEndDates[i]) {
        laneIndex = i;
        break;
      }
    }

    if (laneIndex === -1) {
      laneIndex = lanesEndDates.length;
      lanesEndDates.push(itemEnd);
    } else {
      lanesEndDates[laneIndex] = Math.max(lanesEndDates[laneIndex], itemEnd);
    }

    return { ...item, lane: laneIndex };
  });

  return { items: itemsWithLanes, maxLanes: lanesEndDates.length };
};
