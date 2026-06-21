import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import WarningIcon from '@mui/icons-material/Warning';
import { useNavigate } from 'react-router';
import { useMemo, useState } from 'react';
import {
  MaterialReactTable,
  MRT_ShowHideColumnsButton,
  MRT_ToggleDensePaddingButton,
  MRT_ToggleGlobalFilterButton,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import 'dayjs/locale/pl';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { MRT_Localization_PL } from 'material-react-table/locales/pl';
import { Badge, Typography } from '@mui/material';
import { useFormFilters, useTableState } from '@/shared/lib/useTableSettings';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { plPL } from '@mui/x-date-pickers/locales';
import { FiltersDialog } from './employees-list/EmployeesListFilters';
import {
  getEmployeeAlerts,
  sortByLastName,
  type Employee,
} from '@/entities/employee';
import { useQuery } from '@tanstack/react-query';
import { TablePagination } from '@/shared/ui/TablePagination';
import type { EmployeesFilters } from '../model/types';

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

interface EmployeeListProps {
  employees: Employee[];
  isLoading: boolean;
}

export function EmployeeList({ isLoading, employees }: EmployeeListProps) {
  const navigate = useNavigate();
  const {
    setColumnVisibility,
    setDensity,
    columnVisibility,
    density,
    resetState,
    pagination,
    setPagination,
    columnFilters,
    setColumnFilters,
    columnOrder,
    setColumnOrder,
  } = useTableState('employees', DefaultColumnFilters, ColumnOrderDefault);

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: getEmployeeAlerts,
  });

  const alertsMap = useMemo(() => {
    const map = new Map<string, any[]>();
    alerts.forEach((alert) => {
      if (!map.has(alert.employeeId)) {
        map.set(alert.employeeId, []);
      }
      map.get(alert.employeeId)!.push(alert);
    });
    return map;
  }, [alerts]);

  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const { filters, setFilters, resetFilters } =
    useFormFilters<EmployeesFilters>('constructions', DefaultFiltersState);

  const isFilterActive = useMemo(() => {
    return (
      JSON.stringify(columnFilters) !== JSON.stringify(DefaultColumnFilters)
    );
  }, [columnFilters]);

  const handleRowClick = React.useCallback(
    (row: any) => {
      navigate(`/employees/${row.original.id}`);
    },
    [navigate]
  );

  const handleOpenFilters = () => {
    setFiltersModalOpen(true);
  };

  const handleCloseFilters = () => {
    setFiltersModalOpen(false);
    if (!isFilterActive) resetFilters();
  };

  const handleCloseAndReset = () => {
    setColumnFilters(DefaultColumnFilters);
    resetFilters();
    setFiltersModalOpen(false);
  };

  const handleApplyFilters = () => {
    const columnFilters = [];

    if (filters.name) {
      columnFilters.push({ id: 'name', value: filters.name });
    }

    if (filters.email) {
      columnFilters.push({ id: 'email', value: filters.email });
    }

    if (filters.phone) {
      columnFilters.push({ id: 'phone', value: filters.phone });
    }

    if (filters.birthPlace) {
      columnFilters.push({ id: 'birthPlace', value: filters.birthPlace });
    }

    if (filters.address) {
      columnFilters.push({ id: 'address', value: filters.address });
    }

    if (filters.pesel) {
      columnFilters.push({ id: 'pesel', value: filters.pesel });
    }

    if (filters.birthDateFrom || filters.birthDateTo) {
      columnFilters.push({
        id: 'birthDate',
        value: [filters.birthDateFrom, filters.birthDateTo],
      });
    }

    if (filters.hourRateFrom || filters.hourRateTo) {
      columnFilters.push({
        id: 'hourRate',
        value: {
          min: filters.hourRateFrom ? parseFloat(filters.hourRateFrom) : null,
          max: filters.hourRateTo ? parseFloat(filters.hourRateTo) : null,
        },
      });
    }

    if (filters.isContractor) {
      columnFilters.push({ id: 'isContractor', value: filters.isContractor });
    }

    if (filters.contractStartDateFrom || filters.contractStartDateTo) {
      columnFilters.push({
        id: 'contractStartDate',
        value: [filters.contractStartDateFrom, filters.contractStartDateTo],
      });
    }

    if (filters.contractEndDateFrom || filters.contractEndDateTo) {
      columnFilters.push({
        id: 'contractEndDate',
        value: [filters.contractEndDateFrom, filters.contractEndDateTo],
      });
    }

    if (filters.a1StartDateFrom || filters.a1StartDateTo) {
      columnFilters.push({
        id: 'a1StartDate',
        value: [filters.a1StartDateFrom, filters.a1StartDateTo],
      });
    }

    if (filters.a1EndDateFrom || filters.a1EndDateTo) {
      columnFilters.push({
        id: 'a1EndDate',
        value: [filters.a1EndDateFrom, filters.a1EndDateTo],
      });
    }

    if (filters.status) {
      columnFilters.push({ id: 'status', value: filters.status });
    }
    setColumnFilters(columnFilters);
    setFiltersModalOpen(false);
  };

  const dateBetweenFilterFn = (
    row: any,
    columnId: string,
    filterValue: any
  ) => {
    if (!filterValue || !Array.isArray(filterValue)) return true;

    const [start, end] = filterValue;
    const rowValue = row.getValue(columnId);

    if (!rowValue) return false;

    const rowDate = dayjs.isDayjs(rowValue) ? rowValue : dayjs(rowValue);
    if (!rowDate.isValid()) return false;

    const startDate = start ? dayjs(start).startOf('day') : null;
    const endDate = end ? dayjs(end).endOf('day') : null;

    if (startDate && endDate) {
      return (
        rowDate.isSameOrAfter(startDate) && rowDate.isSameOrBefore(endDate)
      );
    } else if (startDate) {
      return rowDate.isSameOrAfter(startDate);
    } else if (endDate) {
      return rowDate.isSameOrBefore(endDate);
    }

    return true;
  };

  const hourRateFilterFn = (row: any, columnId: string, filterValue: any) => {
    if (!filterValue || typeof filterValue !== 'object') return true;

    const { min, max } = filterValue;
    const rowValue = row.getValue(columnId);
    const hourRate = rowValue || 0;

    if (min !== null && max !== null) {
      return hourRate >= min && hourRate <= max;
    } else if (min !== null) {
      return hourRate >= min;
    } else if (max !== null) {
      return hourRate <= max;
    }

    return true;
  };

  const columns = useMemo<MRT_ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nazwa',
        Cell: ({ renderedCellValue, row }) => {
          const employeeId = row.original.id;
          const employeeAlerts = alertsMap.get(employeeId) || [];
          const hasAlert = employeeAlerts.length > 0;

          return (
            <Box
              sx={(theme) => ({
                color: hasAlert ? theme.palette.warning.dark : '',
              })}
            >
              {renderedCellValue}
            </Box>
          );
        },
        sortingFn: (a, b) => sortByLastName(a.original.name, b.original.name),
      },
      {
        accessorKey: 'email',
        header: 'E-mail',
      },
      {
        accessorKey: 'phone',
        header: 'Telefon',
      },
      {
        accessorKey: 'address',
        header: 'Adres',
      },
      {
        accessorKey: 'pesel',
        header: 'Pesel',
      },
      {
        accessorKey: 'hourRate',
        header: 'Stawka',
        filterVariant: 'range',
        filterFn: hourRateFilterFn,
        Cell: ({ cell }) => {
          const value = cell.getValue<number>();
          if (value === null || value === undefined) return '-';
          return value.toLocaleString('pl-PL', {
            style: 'currency',
            currency: 'EUR',
          });
        },
      },
      {
        accessorKey: 'accountNumber',
        header: 'Numer konta',
      },
      {
        accessorKey: 'isContractor',
        header: 'Kontraktor',
        filterVariant: 'checkbox',
        Cell: ({ cell }) => (
          <Box className="w-full text-center">
            {cell.getValue<boolean>() ? (
              <CheckBoxIcon sx={{ color: 'textSecondary' }} />
            ) : (
              <CheckBoxOutlineBlankIcon sx={{ color: 'textSecondary' }} />
            )}
          </Box>
        ),
      },
      {
        accessorKey: 'birthPlace',
        header: 'Miejsce urodzenia',
      },
      {
        accessorKey: 'birthDate',
        header: 'Data urodzenia',
        filterVariant: 'date-range',
        accessorFn: (originalRow) => {
          const value = originalRow.birthDate;
          if (!value) return null;
          return dayjs(value).isValid() ? dayjs(value).startOf('day') : null;
        },
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
      },
      {
        accessorKey: 'contractStartDate',
        header: 'Data rozpoczęcia umowy',
        filterVariant: 'date-range',
        size: 250,
        accessorFn: (originalRow) => {
          const value = originalRow.contractStartDate;
          if (!value) return null;
          return dayjs(value).isValid() ? dayjs(value).startOf('day') : null;
        },
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
      },
      {
        accessorKey: 'contractEndDate',
        header: 'Data zakończenia umowy',
        size: 250,
        filterVariant: 'date-range',
        accessorFn: (originalRow) => {
          const value = originalRow.contractEndDate;
          if (!value) return null;
          return dayjs(value).isValid() ? dayjs(value).startOf('day') : null;
        },
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
      },
      {
        accessorKey: 'a1StartDate',
        header: 'Data rozpoczęcia A1',
        filterVariant: 'date-range',
        accessorFn: (originalRow) => {
          const value = originalRow.a1StartDate;
          if (!value) return null;
          return dayjs(value).isValid() ? dayjs(value).startOf('day') : null;
        },
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
      },
      {
        accessorKey: 'a1EndDate',
        header: 'Data zakończenia A1',
        filterVariant: 'date-range',
        accessorFn: (originalRow) => {
          const value = originalRow.a1EndDate;
          if (!value) return null;
          return dayjs(value).isValid() ? dayjs(value).startOf('day') : null;
        },
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => row.status,
        filterVariant: 'select',
        filterSelectOptions: [
          { label: 'Aktywni', value: 'true' },
          { label: 'Nieaktywni', value: 'false' },
          { label: 'Wszyscy', value: '' },
        ],
        filterFn: (row: any, _columnId: string, filterValue: string) => {
          if (!filterValue) return true;
          const isEmployed = row.original.status;
          return String(isEmployed) === filterValue;
        },
        Cell: ({ cell }) => (
          <Box
            component="span"
            className={`rounded px-3 py-1`}
            sx={(theme) => ({
              background: cell.getValue<boolean>()
                ? theme.palette.status.employee.active.background
                : theme.palette.status.employee.inactive.background,
              color: cell.getValue<boolean>()
                ? theme.palette.status.employee.active.text
                : theme.palette.status.employee.inactive.text,
            })}
          >
            {cell.getValue<boolean>() ? 'Aktywny' : 'Nieaktywny'}
          </Box>
        ),
      },
    ],
    [alertsMap]
  );

  const localization = React.useMemo(
    () => ({ ...MRT_Localization_PL, rowNumber: 'Lp.' }),
    []
  );

  const tableData = useMemo(() => employees || [], [employees]);

  const table = useMaterialReactTable({
    localization,
    columns,
    data: tableData,
    autoResetPageIndex: false,
    layoutMode: 'semantic',
    state: {
      columnFilters,
      columnVisibility,
      density,
      isLoading: isLoading || alertsLoading,
      pagination,
      columnOrder,
    },
    enableStickyHeader: true,
    muiTableContainerProps: {
      sx: {
        backgroundColor: 'background.default',
        flex: '1 1 auto',
        minHeight: 0,
        overflowY: 'auto',
        '& *': {
          transition: 'none !important',
        },
      },
    },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onDensityChange: setDensity,
    onColumnOrderChange: setColumnOrder,
    enableColumnFilters: false,
    enableColumnOrdering: true,
    enableColumnResizing: true,
    enableColumnActions: false,
    renderToolbarInternalActions: ({ table }) => (
      <Stack direction="row" alignItems="center" spacing={1}>
        <MRT_ToggleGlobalFilterButton table={table} />
        <Tooltip title="Filtry">
          <Badge
            variant="dot"
            badgeContent={isFilterActive ? 1 : 0}
            color="primary"
          >
            <IconButton onClick={handleOpenFilters}>
              <FilterListIcon />
            </IconButton>
          </Badge>
        </Tooltip>
        <MRT_ShowHideColumnsButton table={table} />
        <MRT_ToggleDensePaddingButton table={table} />
        <Tooltip title="Resetuj stan tabeli">
          <IconButton onClick={resetState}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    ),
    muiTablePaperProps: {
      sx: {
        boxShadow: 'none',
        borderRadius: '0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      },
    },
    muiTopToolbarProps: {
      sx: (theme) => ({
        backgroundColor: theme.palette.background.paper,
      }),
    },
    muiTableHeadCellProps: {
      sx: {
        fontWeight: '600',
        fontSize: '14px',
        '& .Mui-TableHeadCell-Content': {
          justifyContent: 'center',
          textAlign: 'center',
        },
      },
      className: 'first:border-l-0',
    },
    muiTableBodyCellProps: {
      sx: (theme) => ({
        borderLeft: `1px solid ${theme.palette.divider}`,
        justifyContent: 'center',
        textAlign: 'center',
      }),
    },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => handleRowClick(row),
      sx: (theme) => ({
        backgroundColor: theme.palette.background.paper,
        cursor: 'pointer',
        '&:hover': {
          background: `${theme.palette.tableHover} !important`,
        },
        'td:after': {
          display: 'none',
        },
      }),
    }),
    muiTableHeadRowProps: {
      sx: {
        boxShadow: 'none !important',
        backgroundImage: 'none !important',
      },
    },
    enableRowNumbers: true,
    displayColumnDefOptions: {
      'mrt-row-numbers': {
        muiTableBodyCellProps: {
          align: 'center',
          sx: {
            borderLeft: 'none',
            padding: 0,
          },
        },
        size: 70,
        enableResizing: false,
        Cell: ({ row, table }) => {
          const employeeId = row.original.id;
          const employeeAlerts = alertsMap.get(employeeId) || [];
          const hasAlert = employeeAlerts.length > 0;

          const { pageIndex, pageSize } = table.getState().pagination;

          const visibleRows = table.getRowModel().rows;

          const relativeIndex = visibleRows.findIndex(
            (visibleRow) => visibleRow.id === row.id
          );

          const globalIndex = pageIndex * pageSize + relativeIndex + 1;

          return (
            <Box>
              <Typography
                fontSize={'0.9rem'}
                sx={(theme) => ({
                  color: hasAlert ? theme.palette.warning.dark : '',
                })}
              >
                {globalIndex}
              </Typography>
              {hasAlert && (
                <Tooltip
                  title={`Alerty: ${alerts.length}`}
                  sx={{
                    position: 'absolute',
                    right: 5,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  <WarningIcon color="warning" fontSize="small" />
                </Tooltip>
              )}
            </Box>
          );
        },
      },
    },
    enableBottomToolbar: false,
  });

  return (
    <LocalizationProvider
      localeText={
        plPL.components.MuiLocalizationProvider.defaultProps.localeText
      }
      dateAdapter={AdapterDayjs}
      adapterLocale="pl"
    >
      <MaterialReactTable table={table} />

      <Box
        sx={{
          flexShrink: 0,
          minHeight: '45px',
        }}
      >
        <TablePagination table={table} />
      </Box>

      <FiltersDialog
        filtersModalOpen={filtersModalOpen}
        setFilters={setFilters}
        filters={filters}
        handleApplyFilters={handleApplyFilters}
        handleCloseFilters={handleCloseFilters}
        handleCloseAndReset={handleCloseAndReset}
      />
    </LocalizationProvider>
  );
}
