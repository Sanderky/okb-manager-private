import { useMemo } from 'react';
import dayjs from 'dayjs';
import type { Lodging, TimelineData, TimelineRow } from '../types';
import type { Construction } from '@/entities/construction';
import { calculateLanes } from '../utils/TimelineHelpers';

const MIN_ROW_HEIGHT = 60;
const BAR_HEIGHT = 36;
const BAR_GAP = 6;
const ROW_PADDING = 12;

export const useTimelineData = (
  lodgings: Lodging[],
  constructions: Construction[]
): TimelineData => {
  const { minDate, totalDays, maxDate } = useMemo(() => {
    if (lodgings.length === 0) {
      const start = dayjs().startOf('month');
      const end = dayjs().endOf('month');
      return {
        minDate: start,
        maxDate: end,
        totalDays: end.diff(start, 'day') + 1,
      };
    }
    const sorted = [...lodgings].sort(
      (a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
    );
    const min = dayjs(sorted[0].startDate).subtract(5, 'day');
    let max = sorted.reduce(
      (acc, curr) =>
        dayjs(curr.endDate).isAfter(acc) ? dayjs(curr.endDate) : acc,
      dayjs(sorted[0].endDate)
    );
    max = max.add(10, 'day');
    return { minDate: min, maxDate: max, totalDays: max.diff(min, 'day') + 1 };
  }, [lodgings]);

  const daysArray = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => minDate.add(i, 'day')),
    [minDate, totalDays]
  );

  const rows = useMemo(() => {
    const relevantConstructions = constructions.filter(
      (s) => s.status || lodgings.some((l) => l.constructionSiteId === s.id)
    );

    relevantConstructions.sort((a, b) => {
      if (a.status === b.status) return a.name.localeCompare(b.name);
      return a.status ? -1 : 1;
    });

    const constructionRows: TimelineRow[] = relevantConstructions.map((construction) => {
      const constructionLodgings = lodgings.filter(
        (l) => l.constructionSiteId === construction.id
      );
      const { items, maxLanes } = calculateLanes(constructionLodgings);

      const linesCount = Math.max(1, maxLanes);
      const rowHeight =
        linesCount * (BAR_HEIGHT + BAR_GAP) + ROW_PADDING * 2 - BAR_GAP;

      return {
        construction: construction,
        lodgings: items,
        height: Math.max(MIN_ROW_HEIGHT, rowHeight),
      };
    });

    const orphans = lodgings.filter((l) => !l.constructionSiteId);
    if (orphans.length > 0) {
      const orphanSite = {
        id: 'orphan',
        name: 'Brak przypisania',
        location: null,
        status: true,
      };
      const { items, maxLanes } = calculateLanes(orphans);
      const linesCount = Math.max(1, maxLanes);
      const rowHeight =
        linesCount * (BAR_HEIGHT + BAR_GAP) + ROW_PADDING * 2 - BAR_GAP;

      constructionRows.push({
        construction: orphanSite,
        lodgings: items,
        height: Math.max(MIN_ROW_HEIGHT, rowHeight),
      });
    }
    return constructionRows;
  }, [constructions, lodgings]);

  return { minDate, maxDate, totalDays, daysArray, rows };
};
