import { useMemo } from 'react';
import useWeekReport from './useWeeksReport';
import type { Construction } from '@/entities/construction';

const useAvailableConstructionsInRange = (weekStarts: Date[]) => {
  const { weeksData, isLoading, error } = useWeekReport({
    weekStarts,
    selectedConstructionIds: [],
  });

  const availableConstructions = useMemo(() => {
    const allConstructions = new Map<string, Construction>();

    weeksData.forEach((week) => {
      week.constructionsWithWorkHours.forEach((construction) => {
        if (!allConstructions.has(construction.id)) {
          allConstructions.set(construction.id, {
            id: construction.id,
            name: construction.name,
          } as Construction);
        }
      });
    });

    return Array.from(allConstructions.values());
  }, [weeksData]);

  return {
    availableConstructions,
    isLoading,
    error,
  };
};

export default useAvailableConstructionsInRange;
