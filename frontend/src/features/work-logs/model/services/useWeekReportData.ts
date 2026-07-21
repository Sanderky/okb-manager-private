import { useMemo } from 'react';
import { useConstructions } from '@/entities/construction';
import { useEmployees } from '@/entities/employee';
import { processSingleWeekData } from '../utils/weeksReportUtils';
import type { TableData } from '../types';
import { useReportData } from '../api/useReportData';

interface UseWeekReportResult {
  weeksData: TableData[];
  isLoading: boolean;
  error: Error | null;
}

interface UseWeekReportParams {
  weekStarts: Date[];
  selectedConstructionIds?: string[];
  selectedEmployeeIds?: string[];
}

export const useWeekReport = ({
  weekStarts,
  selectedConstructionIds = [],
  selectedEmployeeIds = [],
}: UseWeekReportParams): UseWeekReportResult => {
  const { employees: allEmployees = [], isLoading: employeesLoading } =
    useEmployees();

  const {
    constructions: allConstructions = [],
    isLoading: constructionsLoading,
  } = useConstructions();

  const weekQueries = useReportData(weekStarts);

  const isDataLoading = weekQueries.some((query) => query.isLoading);
  const isLoading = isDataLoading || employeesLoading || constructionsLoading;
  const error =
    (weekQueries.find((query) => query.error)?.error as Error) || null;

  const weeksData: TableData[] = useMemo(() => {
    if (isLoading || !allEmployees.length || !allConstructions.length)
      return [];

    return weekQueries.map((query, index) => {
      const currentWeekStart = weekStarts[index] || new Date();

      return processSingleWeekData(
        query.data,
        currentWeekStart,
        allEmployees,
        allConstructions,
        selectedEmployeeIds,
        selectedConstructionIds
      );
    });
  }, [
    weekQueries,
    isLoading,
    weekStarts,
    selectedConstructionIds,
    selectedEmployeeIds,
    allEmployees,
    allConstructions,
  ]);

  return { weeksData, isLoading, error };
};

export default useWeekReport;
