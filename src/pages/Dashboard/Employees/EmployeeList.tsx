import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/PageContainer';
import { useTranslation } from 'react-i18next';
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
import { CircularProgress, Typography } from '@mui/material';
import { useTableState } from '../../../hooks/useTableSettings';
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

interface EmployeeFilters {
  name: string;
  email: string;
  phone: string;
  address: string;
  pesel: string;
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

export default function EmployeeList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    setColumnVisibility,
    setDensity,
    columnVisibility,
    density,
    resetState,
  } = useTableState('employees');

  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [filters, setFilters] = useState<EmployeeFilters>({
    name: '',
    email: '',
    phone: '',
    address: '',
    pesel: '',
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
  });

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

    if (filters.isContractor) {
      columnFilters.push({ id: 'isContractor', value: filters.isContractor });
    }

    // Filtry zakresów dat
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

    table.setColumnFilters(columnFilters);
    handleCloseFilters();
  };

  const handleResetFilters = () => {
    setFilters({
      name: '',
      email: '',
      phone: '',
      address: '',
      pesel: '',
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
      status: '',
    });
    table.setColumnFilters([]);
  };

  // Funkcja do filtrowania zakresów dat
  const dateBetweenFilterFn = (
    row: any,
    columnId: string,
    filterValue: any
  ) => {
    if (!filterValue || !Array.isArray(filterValue)) return true;

    const [start, end] = filterValue;
    const rowValue = row.getValue(columnId);

    if (!rowValue) return true;

    const rowDate = dayjs.isDayjs(rowValue) ? rowValue : dayjs(rowValue);
    if (!rowDate.isValid()) return true;

    const startDate = start ? dayjs(start).startOf('day') : null;
    const endDate = end ? dayjs(end).endOf('day') : null;

    if (startDate && endDate)
      return rowDate.isAfter(startDate) && rowDate.isBefore(endDate);
    if (startDate) return rowDate.isAfter(startDate);
    if (endDate) return rowDate.isBefore(endDate);
    return true;
  };

  const columns = useMemo<MRT_ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Imię',
      },
      {
        accessorKey: 'email',
        header: 'E-mail',
      },
      {
        accessorKey: 'phone',
        header: 'Telefon',
        maxSize: 140,
      },
      {
        accessorKey: 'address',
        header: 'Adres',
      },
      {
        accessorKey: 'pesel',
        header: 'Pesel',
        maxSize: 140,
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
        maxSize: 140,
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
          if (!value || !dayjs(value).isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
        maxSize: 140,
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
          if (!value || !dayjs(value).isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
        maxSize: 140,
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
          if (!value || !dayjs(value).isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
        maxSize: 140,
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
          if (!value || !dayjs(value).isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
        maxSize: 140,
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
          if (!value || !dayjs(value).isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
        maxSize: 140,
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => row.status,
        filterVariant: 'select',
        filterSelectOptions: [
          { label: 'Zatrudnieni', value: 'true' },
          { label: 'Niezatrudnieni', value: 'false' },
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
              cell.getValue<boolean>() ? 'bg-green-400/50' : 'bg-red-400/50'
            }`}
          >
            {cell.getValue<boolean>() ? 'Zatrudniony' : 'Niezatrudniony'}
          </Box>
        ),
        maxSize: 150,
      },
    ],
    []
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
    layoutMode: 'grid',
    initialState: {
      density: 'comfortable',
      columnOrder: [
        'mrt-row-numbers',
        'name',
        'email',
        'phone',
        'pesel',
        'address',
        'birthDate',
        'isContractor',
        'contractStartDate',
        'contractEndDate',
        'a1StartDate',
        'a1EndDate',
        'status',
      ],
      columnFilters: [{ id: 'status', value: 'true' }],
      columnVisibility: {
        address: false,
        birthDate: false,
        isContractor: false,
        contractEndDate: false,
        a1EndDate: false,
      },
    },
    state: {
      // columnVisibility,
      density,
      isLoading,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onDensityChange: setDensity,
    enableColumnFilters: false,
    enableColumnResizing: true,
    renderTopToolbarCustomActions: () => (
      <Button
        variant="outlined"
        onClick={handleCreateClick}
        startIcon={<AddIcon />}
        size="small"
        sx={{ mx: 1, my: 0.5, minWidth: 'fit-content' }}
      >
        Nowy
      </Button>
    ),
    renderToolbarInternalActions: ({ table }) => (
      <Stack direction="row" alignItems="center" spacing={1}>
        <MRT_ToggleGlobalFilterButton table={table} />
        <Tooltip title="Filtry">
          <IconButton onClick={handleOpenFilters}>
            <FilterListIcon />
          </IconButton>
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
        '&:first-child .Mui-TableHeadCell-Content': {
          justifyContent: 'center',
          textAlign: 'center',
        },
      },
      className: 'first:border-l-0',
    },
    muiTableBodyCellProps: {
      sx: {
        borderLeft: '1px solid #e0e0e0',
      },
    },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => handleRowClick(row),
      sx: {
        cursor: 'pointer',
        '&:hover': {
          background: '#ffd85f30 !important',
        },
        'td:after': {
          display: 'none',
        },
      },
    }),
    enableRowNumbers: true,
    displayColumnDefOptions: {
      'mrt-row-numbers': {
        muiTableBodyCellProps: {
          align: 'center',
          sx: { borderLeft: 'none' },
        },
        size: 80,
        enableResizing: false,
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

  if (isLoading) {
    return (
      <PageContainer
        title={t('employees.employeesList')}
        breadcrumbs={[{ title: t('employees.employees') }]}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Trwa ładowanie listy pracowników...
          </Typography>
        </Stack>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer
        title={t('employees.employeesList')}
        breadcrumbs={[{ title: t('employees.employees') }]}
      >
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Ponów próbę
            </Button>
          }
        >
          Nie udało się załadować listy pracowników: {error.message}
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={'Lista pracowników'}
      breadcrumbs={[{ title: 'Pracownicy' }]}
      actions={<Stack direction="row" alignItems="center" spacing={1}></Stack>}
    >
      <Box sx={{ flex: 1, width: '100%' }}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
          <MaterialReactTable table={table} />

          {/* Modal z filtrami */}
          <Dialog
            open={filtersModalOpen}
            onClose={handleCloseFilters}
            maxWidth="md"
            fullWidth
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
                  <FormLabel className="mb-2 block">Imię</FormLabel>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Imię"
                    value={filters.name}
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
                    placeholder="E-mail"
                    value={filters.email}
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
                    placeholder="Telefon"
                    value={filters.phone}
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
                    placeholder="Pesel"
                    value={filters.pesel}
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
                    placeholder="Adres"
                    value={filters.address}
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
                      value={filters.status}
                      displayEmpty
                      onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                      }
                    >
                      <MenuItem value="">Wszyscy</MenuItem>
                      <MenuItem value="true">Zatrudnieni</MenuItem>
                      <MenuItem value="false">Niezatrudnieni</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <FormLabel className="mb-2 block">Kontraktor</FormLabel>
                    <Select
                      size="small"
                      value={filters.isContractor}
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

                {/* Data urodzenia */}
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
                      value={filters.birthDateFrom}
                      onChange={(newValue) =>
                        setFilters({ ...filters, birthDateFrom: newValue })
                      }
                      slotProps={{
                        textField: { fullWidth: true, size: 'small' },
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
                      value={filters.birthDateTo}
                      onChange={(newValue) =>
                        setFilters({ ...filters, birthDateTo: newValue })
                      }
                      slotProps={{
                        textField: { fullWidth: true, size: 'small' },
                      }}
                    />
                  </Stack>
                </Grid>

                {/* Zakres daty umowy */}
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
                      value={filters.contractStartDateFrom}
                      onChange={(newValue) =>
                        setFilters({
                          ...filters,
                          contractStartDateFrom: newValue,
                        })
                      }
                      slotProps={{
                        textField: { fullWidth: true, size: 'small' },
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
                      value={filters.contractStartDateTo}
                      onChange={(newValue) =>
                        setFilters({
                          ...filters,
                          contractStartDateTo: newValue,
                        })
                      }
                      slotProps={{
                        textField: { fullWidth: true, size: 'small' },
                      }}
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
                      value={filters.contractEndDateFrom}
                      onChange={(newValue) =>
                        setFilters({
                          ...filters,
                          contractEndDateFrom: newValue,
                        })
                      }
                      slotProps={{
                        textField: { fullWidth: true, size: 'small' },
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
                      value={filters.contractEndDateTo}
                      onChange={(newValue) =>
                        setFilters({
                          ...filters,
                          contractEndDateTo: newValue,
                        })
                      }
                      slotProps={{
                        textField: { fullWidth: true, size: 'small' },
                      }}
                    />
                  </Stack>
                </Grid>

                {/* Zakres daty A1 */}
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
                      value={filters.a1StartDateFrom}
                      onChange={(newValue) =>
                        setFilters({ ...filters, a1StartDateFrom: newValue })
                      }
                      slotProps={{
                        textField: { fullWidth: true, size: 'small' },
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
                      value={filters.a1StartDateTo}
                      onChange={(newValue) =>
                        setFilters({ ...filters, a1StartDateTo: newValue })
                      }
                      slotProps={{
                        textField: { fullWidth: true, size: 'small' },
                      }}
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
                      value={filters.a1EndDateFrom}
                      onChange={(newValue) =>
                        setFilters({ ...filters, a1EndDateFrom: newValue })
                      }
                      slotProps={{
                        textField: { fullWidth: true, size: 'small' },
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
                      value={filters.a1EndDateTo}
                      onChange={(newValue) =>
                        setFilters({ ...filters, a1EndDateTo: newValue })
                      }
                      slotProps={{
                        textField: { fullWidth: true, size: 'small' },
                      }}
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
                  onClick={handleResetFilters}
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
