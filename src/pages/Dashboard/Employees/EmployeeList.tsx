import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import WarningIcon from '@mui/icons-material/Warning';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/PageContainer';
import { getEmployeeList } from '../../../api/employees';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import {
  MaterialReactTable,
  MRT_ShowHideColumnsButton,
  MRT_TablePagination,
  MRT_ToggleDensePaddingButton,
  MRT_ToggleGlobalFilterButton,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import type { Employee } from '../../../types';
import 'dayjs/locale/pl';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { MRT_Localization_PL } from 'material-react-table/locales/pl';
import { Badge, Typography } from '@mui/material';
import { useFormFilters, useTableState } from '../../../hooks/useTableSettings';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  Select,
  Grid,
  FormLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CloseIcon from '@mui/icons-material/Close';
import { useEmployeeAlert } from '../../../context/EmployeeAlertContext';
import { plPL } from '@mui/x-date-pickers/locales';

import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface EmployeesFilters {
  name: string;
  email: string;
  phone: string;
  address: string;
  pesel: string;
  birthPlace: string;
  hourRateFrom: string;
  hourRateTo: string;
  birthDateFrom: Dayjs | null;
  birthDateTo: Dayjs | null;
  isContractor: string;
  contractStartDateFrom: Dayjs | null;
  contractStartDateTo: Dayjs | null;
  contractEndDateFrom: Dayjs | null;
  contractEndDateTo: Dayjs | null;
  a1StartDateFrom: Dayjs | null;
  a1StartDateTo: Dayjs | null;
  a1EndDateFrom: Dayjs | null;
  a1EndDateTo: Dayjs | null;
  status: string;
}

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

const DefaultColumnFilters = [{ id: 'status', value: 'true' }];

export default function EmployeeList() {
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
  } = useTableState('employees', DefaultColumnFilters);

  const { getEmployeeAlerts } = useEmployeeAlert();

  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const { filters, setFilters, resetFilters } =
    useFormFilters<EmployeesFilters>('constructions', DefaultFiltersState);

  const isFilterActive = useMemo(() => {
    return (
      JSON.stringify(columnFilters) !== JSON.stringify(DefaultColumnFilters)
    );
  }, [columnFilters]);

  const {
    data: employees,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
  });

  const handleCreateClick = React.useCallback(() => {
    navigate('/employees/create');
  }, [navigate]);

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
        Cell: ({ row }) => {
          const employeeId = row.original.id;
          const alerts = getEmployeeAlerts(employeeId);
          const hasAlert = alerts.length > 0;

          return (
            <Box className={`${hasAlert && 'text-amber-500'}`}>
              {row.original.name}
            </Box>
          );
        },
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
            {cell.getValue<boolean>() ? 'Tak' : 'Nie'}
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
            className={`rounded px-3 py-1 ${
              cell.getValue<boolean>()
                ? 'bg-green-300/50 text-green-600'
                : 'bg-red-300/50 text-red-600'
            }`}
          >
            {cell.getValue<boolean>() ? 'Aktywny' : 'Nieaktywny'}
          </Box>
        ),
      },
    ],
    [getEmployeeAlerts]
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
    layoutMode: 'semantic',
    initialState: {
      density: 'comfortable',
      columnOrder: [
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
      ],
      columnVisibility: {
        address: false,
        birthDate: false,
        isContractor: false,
        contractEndDate: false,
        a1EndDate: false,
      },
    },
    state: {
      columnFilters,
      columnVisibility,
      density,
      isLoading: isLoading,
      pagination,
    },
    muiTableContainerProps: {
      sx: {
        '& *': {
          transition: 'none !important',
        },
      },
    },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onDensityChange: setDensity,
    enableColumnFilters: false,
    enableColumnResizing: true,
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
        border: '1px solid #e0e0e0',
        borderRadius: '10px',
      },
    },
    muiTableHeadCellProps: {
      sx: {
        borderTop: '1px solid #e0e0e0',
        borderLeft: '1px solid #e0e0e0',
        fontWeight: '600',
        color: '#374151',
        fontSize: '14px',
        '& .Mui-TableHeadCell-Content': {
          justifyContent: 'center',
          textAlign: 'center',
        },
      },
      className: 'first:border-l-0',
    },
    muiTableBodyCellProps: {
      sx: {
        borderLeft: '1px solid #e0e0e0',
        justifyContent: 'center',
        textAlign: 'center',
      },
    },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => handleRowClick(row),
      sx: {
        cursor: 'pointer',
        '&:hover': {
          background: '#5fadff14 !important',
        },
        'td:after': {
          display: 'none',
        },
      },
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
          const alerts = getEmployeeAlerts(employeeId);
          const hasAlert = alerts.length > 0;

          const visibleRows = table.getRowModel().rows;

          const globalIndex =
            visibleRows.findIndex((visibleRow) => visibleRow.id === row.id) + 1;

          return (
            <Box>
              <Typography className={`${hasAlert && 'text-amber-500'}`}>
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
    renderBottomToolbar: ({ table }) => (
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
      >
        <Box
          sx={{
            fontSize: 12,
            color: 'text.secondary',
            textAlign: 'center',
            pt: { xs: 2, sm: 0 },
            px: { xs: 0, sm: 2 },
          }}
        >
          Wynik: {table.getPrePaginationRowModel().rows.length} z{' '}
          {tableData.length}
        </Box>
        <MRT_TablePagination table={table} />
      </Stack>
    ),
    paginationDisplayMode: 'pages',
    muiPaginationProps: {
      color: 'primary',
      rowsPerPageOptions: [5, 10, 25, 50, 100],
      shape: 'rounded',
      variant: 'outlined',
    },
  });

  if (error) {
    return (
      <PageContainer breadcrumbs={[{ title: 'Lista pracowników' }]}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Ponów próbę
            </Button>
          }
        >
          Nie udało się załadować listy pracowników.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      breadcrumbs={[{ title: 'Lista pracowników' }]}
      actions={
        <Button
          variant="contained"
          onClick={handleCreateClick}
          startIcon={<AddIcon />}
          size="small"
          sx={{ mx: 1, my: 0.5, minWidth: 'fit-content' }}
        >
          Nowy
        </Button>
      }
    >
      <Box sx={{ flex: 1, width: '100%' }}>
        <LocalizationProvider
          localeText={
            plPL.components.MuiLocalizationProvider.defaultProps.localeText
          }
          dateAdapter={AdapterDayjs}
          adapterLocale="pl"
        >
          <MaterialReactTable table={table} />

          <Dialog
            open={filtersModalOpen}
            onClose={handleCloseFilters}
            maxWidth="md"
            fullWidth
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 2,
                  width: '95%',
                  m: 0,
                },
              },
            }}
          >
            <DialogTitle className="p-3 sm:p-5">
              <Stack
                direction={'row'}
                alignItems={'center'}
                justifyContent={'space-between'}
              >
                <Typography variant="h6">Filtry pracowników</Typography>
                <IconButton onClick={handleCloseFilters}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent dividers className="p-3 sm:p-5">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormLabel className="mb-2 block">Imię i nazwisko</FormLabel>
                  <TextField
                    size="small"
                    fullWidth
                    value={filters.name ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, name: e.target.value })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormLabel className="mb-2 block">E-mail</FormLabel>
                  <TextField
                    size="small"
                    fullWidth
                    value={filters.email ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, email: e.target.value })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormLabel className="mb-2 block">Telefon</FormLabel>
                  <TextField
                    size="small"
                    fullWidth
                    value={filters.phone ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, phone: e.target.value })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormLabel className="mb-2 block">Pesel</FormLabel>
                  <TextField
                    size="small"
                    fullWidth
                    value={filters.pesel ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, pesel: e.target.value })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormLabel className="mb-2 block">Adres</FormLabel>
                  <TextField
                    size="small"
                    fullWidth
                    value={filters.address ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, address: e.target.value })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <FormLabel className="mb-2 block">Status</FormLabel>
                    <Select
                      size="small"
                      value={filters.status ?? ""}
                      displayEmpty
                      onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                      }
                    >
                      <MenuItem value="">Wszyscy</MenuItem>
                      <MenuItem value="true">Aktywni</MenuItem>
                      <MenuItem value="false">Nieaktywni</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <FormLabel className="mb-2 block">Kontraktor</FormLabel>
                    <Select
                      size="small"
                      value={filters.isContractor ?? ""}
                      displayEmpty
                      onChange={(e) =>
                        setFilters({ ...filters, isContractor: e.target.value })
                      }
                    >
                      <MenuItem value="">Wszyscy</MenuItem>
                      <MenuItem value="true">Tak</MenuItem>
                      <MenuItem value="false">Nie</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormLabel className="mb-2 block">Stawka</FormLabel>
                  <Stack
                    direction={{
                      xs: 'column',
                      sm: 'row',
                    }}
                    alignItems={'center'}
                    spacing={1}
                  >
                    <TextField
                      size="small"
                      type="number"
                      value={filters.hourRateFrom ?? ""}
                      label="Od"
                      onChange={(e) => {
                        setFilters({
                          ...filters,
                          hourRateFrom: e.target.value,
                        });
                      }}
                    />
                    <Typography
                      sx={{
                        display: {
                          xs: 'none',
                          sm: 'block',
                        },
                      }}
                    >
                      -
                    </Typography>
                    <TextField
                      type="number"
                      value={filters.hourRateTo ?? ""}
                      label="Do"
                      size="small"
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          hourRateTo: e.target.value,
                        })
                      }
                    />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormLabel className="mb-2 block">
                    Miejsce urodzenia
                  </FormLabel>
                  <TextField
                    size="small"
                    fullWidth
                    value={filters.birthPlace ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, birthPlace: e.target.value })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormLabel className="mb-2 block">Data urodzenia</FormLabel>
                  <Stack
                    direction={{
                      xs: 'column',
                      sm: 'row',
                    }}
                    alignItems={'center'}
                    spacing={1}
                  >
                    <DatePicker
                      label="Od"
                      openTo="month"
                      views={['year', 'month', 'day']}
                      value={filters.birthDateFrom ?? null}
                      onChange={(newValue) =>
                        setFilters({ ...filters, birthDateFrom: newValue })
                      }
                      slotProps={{
                        field: {
                          clearable: true,
                          onClear: () =>
                            setFilters({
                              ...filters,
                              birthDateFrom: null,
                            }),
                        },
                        textField: {
                          fullWidth: true,
                          size: 'small',
                        },
                      }}
                    />
                    <Typography
                      sx={{
                        display: {
                          xs: 'none',
                          sm: 'block',
                        },
                      }}
                    >
                      -
                    </Typography>
                    <DatePicker
                      openTo="month"
                      views={['year', 'month', 'day']}
                      label="Do"
                      value={filters.birthDateTo ?? null}
                      onChange={(newValue) =>
                        setFilters({ ...filters, birthDateTo: newValue })
                      }
                      slotProps={{
                        field: {
                          clearable: true,
                          onClear: () =>
                            setFilters({
                              ...filters,
                              birthDateTo: null,
                            }),
                        },
                        textField: {
                          fullWidth: true,
                          size: 'small',
                        },
                      }}
                      minDate={filters.birthDateFrom || undefined}
                    />
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormLabel className="mb-2 block">
                    Data rozpoczęcia umowy
                  </FormLabel>
                  <Stack
                    direction={{
                      xs: 'column',
                      sm: 'row',
                    }}
                    alignItems={'center'}
                    spacing={1}
                  >
                    <DatePicker
                      label="Od"
                      openTo="month"
                      views={['year', 'month', 'day']}
                      value={filters.contractStartDateFrom ?? null}
                      onChange={(newValue) =>
                        setFilters({
                          ...filters,
                          contractStartDateFrom: newValue,
                        })
                      }
                      slotProps={{
                        field: {
                          clearable: true,
                          onClear: () =>
                            setFilters({
                              ...filters,
                              contractStartDateFrom: null,
                            }),
                        },
                        textField: {
                          fullWidth: true,
                          size: 'small',
                        },
                      }}
                    />
                    <Typography
                      sx={{
                        display: {
                          xs: 'none',
                          sm: 'block',
                        },
                      }}
                    >
                      -
                    </Typography>
                    <DatePicker
                      label="Do"
                      openTo="month"
                      views={['year', 'month', 'day']}
                      value={filters.contractStartDateTo ?? null}
                      onChange={(newValue) =>
                        setFilters({
                          ...filters,
                          contractStartDateTo: newValue,
                        })
                      }
                      slotProps={{
                        field: {
                          clearable: true,
                          onClear: () =>
                            setFilters({
                              ...filters,
                              contractStartDateTo: null,
                            }),
                        },
                        textField: {
                          fullWidth: true,
                          size: 'small',
                        },
                      }}
                      minDate={filters.contractStartDateFrom || undefined}
                    />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormLabel className="mb-2 block">
                    Data zakończenia umowy
                  </FormLabel>
                  <Stack
                    direction={{
                      xs: 'column',
                      sm: 'row',
                    }}
                    alignItems={'center'}
                    spacing={1}
                  >
                    <DatePicker
                      label="Od"
                      openTo="month"
                      views={['year', 'month', 'day']}
                      value={filters.contractEndDateFrom ?? null}
                      onChange={(newValue) =>
                        setFilters({
                          ...filters,
                          contractEndDateFrom: newValue,
                        })
                      }
                      slotProps={{
                        field: {
                          clearable: true,
                          onClear: () =>
                            setFilters({
                              ...filters,
                              contractEndDateFrom: null,
                            }),
                        },
                        textField: {
                          fullWidth: true,
                          size: 'small',
                        },
                      }}
                    />
                    <Typography
                      sx={{
                        display: {
                          xs: 'none',
                          sm: 'block',
                        },
                      }}
                    >
                      -
                    </Typography>
                    <DatePicker
                      label="Do"
                      openTo="month"
                      views={['year', 'month', 'day']}
                      value={filters.contractEndDateTo ?? null}
                      onChange={(newValue) =>
                        setFilters({
                          ...filters,
                          contractEndDateTo: newValue,
                        })
                      }
                      slotProps={{
                        field: {
                          clearable: true,
                          onClear: () =>
                            setFilters({
                              ...filters,
                              contractEndDateTo: null,
                            }),
                        },
                        textField: {
                          fullWidth: true,
                          size: 'small',
                        },
                      }}
                      minDate={filters.contractEndDateFrom || undefined}
                    />
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormLabel className="mb-2 block">
                    Data rozpoczęcia A1
                  </FormLabel>
                  <Stack
                    direction={{
                      xs: 'column',
                      sm: 'row',
                    }}
                    alignItems={'center'}
                    spacing={1}
                  >
                    <DatePicker
                      label="Od"
                      openTo="month"
                      views={['year', 'month', 'day']}
                      value={filters.a1StartDateFrom ?? null}
                      onChange={(newValue) =>
                        setFilters({ ...filters, a1StartDateFrom: newValue })
                      }
                      slotProps={{
                        field: {
                          clearable: true,
                          onClear: () =>
                            setFilters({
                              ...filters,
                              a1StartDateFrom: null,
                            }),
                        },
                        textField: {
                          fullWidth: true,
                          size: 'small',
                        },
                      }}
                    />
                    <Typography
                      sx={{
                        display: {
                          xs: 'none',
                          sm: 'block',
                        },
                      }}
                    >
                      -
                    </Typography>
                    <DatePicker
                      label="Do"
                      openTo="month"
                      views={['year', 'month', 'day']}
                      value={filters.a1StartDateTo ?? null}
                      onChange={(newValue) =>
                        setFilters({ ...filters, a1StartDateTo: newValue })
                      }
                      slotProps={{
                        field: {
                          clearable: true,
                          onClear: () =>
                            setFilters({
                              ...filters,
                              a1StartDateTo: null,
                            }),
                        },
                        textField: {
                          fullWidth: true,
                          size: 'small',
                        },
                      }}
                      minDate={filters.a1StartDateFrom || undefined}
                    />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormLabel className="mb-2 block">
                    Data zakończenia A1
                  </FormLabel>
                  <Stack
                    direction={{
                      xs: 'column',
                      sm: 'row',
                    }}
                    alignItems={'center'}
                    spacing={1}
                  >
                    <DatePicker
                      label="Od"
                      openTo="month"
                      views={['year', 'month', 'day']}
                      value={filters.a1EndDateFrom ?? null}
                      onChange={(newValue) =>
                        setFilters({ ...filters, a1EndDateFrom: newValue })
                      }
                      slotProps={{
                        field: {
                          clearable: true,
                          onClear: () =>
                            setFilters({
                              ...filters,
                              a1EndDateFrom: null,
                            }),
                        },
                        textField: {
                          fullWidth: true,
                          size: 'small',
                        },
                      }}
                    />
                    <Typography
                      sx={{
                        display: {
                          xs: 'none',
                          sm: 'block',
                        },
                      }}
                    >
                      -
                    </Typography>
                    <DatePicker
                      label="Do"
                      openTo="month"
                      views={['year', 'month', 'day']}
                      value={filters.a1EndDateTo ?? null}
                      onChange={(newValue) =>
                        setFilters({ ...filters, a1EndDateTo: newValue })
                      }
                      slotProps={{
                        field: {
                          clearable: true,
                          onClear: () =>
                            setFilters({
                              ...filters,
                              a1EndDateTo: null,
                            }),
                        },
                        textField: {
                          fullWidth: true,
                          size: 'small',
                        },
                      }}
                      minDate={filters.a1EndDateFrom || undefined}
                    />
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions className="p-3 sm:p-5">
              <Stack
                direction={{
                  xs: 'column',
                  sm: 'row',
                }}
                alignItems={{
                  xs: 'stretch',
                  sm: 'center',
                }}
                justifyContent={'flex-end'}
                spacing={1}
                sx={{
                  width: '100%',
                }}
              >
                <Button
                  onClick={handleCloseAndReset}
                  variant="outlined"
                  color="primary"
                >
                  Wyczyść filtry
                </Button>
                <Button onClick={handleApplyFilters} variant="contained">
                  Zastosuj filtry
                </Button>
              </Stack>
            </DialogActions>
          </Dialog>
        </LocalizationProvider>
      </Box>
    </PageContainer>
  );
}