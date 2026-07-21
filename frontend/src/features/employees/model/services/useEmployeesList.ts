import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useFormFilters, useTableState } from '@/shared/lib/useTableSettings';
import { useEmployeeAlerts, type Employee } from '@/entities/employee';
import { useEmployeeColumns } from '../../lib/useEmployeesColumns';
import type { EmployeesFilters } from '../types';

const ColumnOrderDefault = [
  'mrt-row-numbers',
  'name',
  'status',
  'phone',
  'email',
  'address',
  'pesel',
  'isContractor',
  'hourRate',
  'birthPlace',
  'birthDate',
  'accountNumber',
  'contractStartDate',
  'contractEndDate',
  'a1StartDate',
  'a1EndDate',
];
const DefaultColumnFilters = [{ id: 'status', value: 'true' }];
const DefaultFiltersState: EmployeesFilters = {
  name: '',
  email: '',
  phone: '',
  address: '',
  pesel: '',
  birthPlace: '',
  hourRateFrom: '',
  hourRateTo: '',
  birthDateFrom: null,
  birthDateTo: null,
  isContractor: '',
  contractStartDateFrom: null,
  contractStartDateTo: null,
  contractEndDateFrom: null,
  contractEndDateTo: null,
  a1StartDateFrom: null,
  a1StartDateTo: null,
  a1EndDateFrom: null,
  a1EndDateTo: null,
  status: 'true',
};

export const useEmployeeList = (
  employees: Employee[],
  isLoadingProps: boolean
) => {
  const navigate = useNavigate();
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);

  const tableState = useTableState(
    'employees',
    DefaultColumnFilters,
    ColumnOrderDefault
  );
  const { filters, setFilters, resetFilters } =
    useFormFilters<EmployeesFilters>('constructions', DefaultFiltersState);

  const { alerts, isLoading: alertsLoading } = useEmployeeAlerts();

  const alertsMap = useMemo(() => {
    const map = new Map<string, any[]>();
    alerts.forEach((alert) => {
      if (!map.has(alert.employeeId)) map.set(alert.employeeId, []);
      map.get(alert.employeeId)!.push(alert);
    });
    return map;
  }, [alerts]);

  const isFilterActive = useMemo(
    () =>
      JSON.stringify(tableState.columnFilters) !==
      JSON.stringify(DefaultColumnFilters),
    [tableState.columnFilters]
  );

  const columns = useEmployeeColumns(alertsMap);
  const tableData = useMemo(() => employees || [], [employees]);

  const handleRowClick = useCallback(
    (row: any) => navigate(`/employees/${row.original.id}`),
    [navigate]
  );

  const handleApplyFilters = () => {
    const newFilters = [];
    if (filters.name) newFilters.push({ id: 'name', value: filters.name });
    if (filters.email) newFilters.push({ id: 'email', value: filters.email });
    if (filters.phone) newFilters.push({ id: 'phone', value: filters.phone });
    if (filters.birthPlace)
      newFilters.push({ id: 'birthPlace', value: filters.birthPlace });
    if (filters.address)
      newFilters.push({ id: 'address', value: filters.address });
    if (filters.pesel) newFilters.push({ id: 'pesel', value: filters.pesel });
    if (filters.birthDateFrom || filters.birthDateTo)
      newFilters.push({
        id: 'birthDate',
        value: [filters.birthDateFrom, filters.birthDateTo],
      });
    if (filters.hourRateFrom || filters.hourRateTo)
      newFilters.push({
        id: 'hourRate',
        value: {
          min: filters.hourRateFrom ? parseFloat(filters.hourRateFrom) : null,
          max: filters.hourRateTo ? parseFloat(filters.hourRateTo) : null,
        },
      });
    if (filters.isContractor)
      newFilters.push({ id: 'isContractor', value: filters.isContractor });
    if (filters.contractStartDateFrom || filters.contractStartDateTo)
      newFilters.push({
        id: 'contractStartDate',
        value: [filters.contractStartDateFrom, filters.contractStartDateTo],
      });
    if (filters.contractEndDateFrom || filters.contractEndDateTo)
      newFilters.push({
        id: 'contractEndDate',
        value: [filters.contractEndDateFrom, filters.contractEndDateTo],
      });
    if (filters.a1StartDateFrom || filters.a1StartDateTo)
      newFilters.push({
        id: 'a1StartDate',
        value: [filters.a1StartDateFrom, filters.a1StartDateTo],
      });
    if (filters.a1EndDateFrom || filters.a1EndDateTo)
      newFilters.push({
        id: 'a1EndDate',
        value: [filters.a1EndDateFrom, filters.a1EndDateTo],
      });
    if (filters.status)
      newFilters.push({ id: 'status', value: filters.status });

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
    isLoading: isLoadingProps || alertsLoading,
    tableState,
    filters,
    setFilters,
    filtersModalOpen,
    setFiltersModalOpen,
    isFilterActive,
    handleRowClick,
    handleApplyFilters,
    handleCloseFilters,
    handleCloseAndReset,
    alertsMap,
    alerts,
  };
};
