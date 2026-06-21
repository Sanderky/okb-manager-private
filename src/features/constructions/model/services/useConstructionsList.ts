import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormFilters, useTableState } from '@/shared/lib/useTableSettings';
import { useContractors } from '@/entities/contractor';
import { useActiveEmployeesCount } from '@/entities/employee';
import type { Construction } from '@/entities/construction';
import type { ConstructionsFilters } from '../types';
import { useConstructionsColumns } from '../../lib/useConstructionsColumns';

const DefaultFiltersState: ConstructionsFilters = {
  name: '',
  contractor: '',
  location: '',
  startDateFrom: null,
  startDateTo: null,
  endDateFrom: null,
  endDateTo: null,
  status: 'true',
  employeeCountMin: '',
  employeeCountMax: '',
};
const DefaultColumnFilters = [{ id: 'status', value: 'true' }];
const DefaultColumnsOrder = [
  'mrt-row-numbers',
  'name',
  'status',
  'employeeCount',
  'contractor',
  'location',
  'startDate',
  'endDate',
];

export const useConstructionsList = (
  constructions: Construction[],
  isLoadingProps: boolean
) => {
  const navigate = useNavigate();
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);

  const tableState = useTableState(
    'constructions',
    DefaultColumnFilters,
    DefaultColumnsOrder
  );
  const { filters, setFilters, resetFilters } =
    useFormFilters<ConstructionsFilters>('constructions', DefaultFiltersState);

  const isFilterActive = useMemo(
    () =>
      JSON.stringify(tableState.columnFilters) !==
      JSON.stringify(DefaultColumnFilters),
    [tableState.columnFilters]
  );

  const { data: contractors } = useContractors();
  const contractorOptions = useMemo(
    () => contractors?.map((c) => ({ label: c.name, id: c.id })) || [],
    [contractors]
  );

  const constructionIds = useMemo(() => {
    return constructions?.map((c) => c.id) || [];
  }, [constructions]);

  const { data: employeesData } = useActiveEmployeesCount(constructionIds);

  const columns = useConstructionsColumns(employeesData);
  const tableData = useMemo(
    () =>
      constructions?.map((c) => ({
        ...c,
        employeeCount: employeesData?.[c.id] || 0,
      })) || [],
    [constructions, employeesData]
  );

  const handleRowClick = useCallback(
    (row: any) => navigate(`/constructions/${row.original.id}`),
    [navigate]
  );

  const handleApplyFilters = () => {
    const newFilters = [];
    if (filters.name) newFilters.push({ id: 'name', value: filters.name });
    if (filters.contractor)
      newFilters.push({ id: 'contractorName', value: filters.contractor });
    if (filters.location)
      newFilters.push({ id: 'location', value: filters.location });
    if (filters.startDateFrom || filters.startDateTo)
      newFilters.push({
        id: 'startDate',
        value: [filters.startDateFrom, filters.startDateTo],
      });
    if (filters.endDateFrom || filters.endDateTo)
      newFilters.push({
        id: 'endDate',
        value: [filters.endDateFrom, filters.endDateTo],
      });
    if (filters.status)
      newFilters.push({ id: 'status', value: filters.status });
    if (filters.employeeCountMin || filters.employeeCountMax) {
      newFilters.push({
        id: 'employeeCount',
        value: {
          min: filters.employeeCountMin
            ? parseInt(filters.employeeCountMin)
            : null,
          max: filters.employeeCountMax
            ? parseInt(filters.employeeCountMax)
            : null,
        },
      });
    }
    tableState.setColumnFilters(newFilters);
    setFiltersModalOpen(false);
  };

  const handleCloseFilters = () => {
    setFiltersModalOpen(false);
    if (!isFilterActive) resetFilters();
  };
  const handleCloseAndReset = () => {
    tableState.setColumnFilters(DefaultColumnFilters);
    resetFilters();
    setFiltersModalOpen(false);
  };

  return {
    columns,
    tableData,
    isLoading: isLoadingProps,
    tableState,
    filters,
    setFilters,
    filtersModalOpen,
    setFiltersModalOpen,
    contractorOptions,
    isFilterActive,
    handleRowClick,
    handleApplyFilters,
    handleCloseFilters,
    handleCloseAndReset,
  };
};
