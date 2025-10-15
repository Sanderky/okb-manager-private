import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/PageContainer';
import { useTranslation } from 'react-i18next';
import { getEmployeeList } from '../../../api/employees';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import Alert from '@mui/material/Alert';
import {
  MaterialReactTable,
  MRT_ShowHideColumnsButton,
  MRT_TablePagination,
  MRT_ToggleDensePaddingButton,
  MRT_ToggleFiltersButton,
  MRT_ToggleGlobalFilterButton,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import type { Employee } from '../../../types';
import 'dayjs/locale/pl';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import { MRT_Localization_PL } from 'material-react-table/locales/pl';
import {
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTableState } from '../../../hooks/useTableSettings';


export default function EmployeeList() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {density, setDensity, setColumnVisibility, columnVisibility} = useTableState('employees')

  const { data: employees, isLoading, error, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
  });

  const handleCreateClick = React.useCallback(() => {
    navigate('/employees/create');
  }, [navigate]);

  const localization = React.useMemo(
    () => ({ ...MRT_Localization_PL, rowNumber: 'Lp.' }),
    []
  );

  const columns = useMemo<MRT_ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Imię',
        size: 150,
      },
      {
        accessorKey: 'email',
        header: 'E-mail',
        size: 150,
      },
      {
        accessorKey: 'phone',
        header: 'Telefon',
        size: 150,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        filterVariant: 'select',
        filterSelectOptions: [
          {label: 'Zatrudnieni', value: 'true'},
          {label: 'Niezatrudnieni', value: 'false'},
          {label: 'Wszyscy', value: ''},
        ],
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
        size: 125,
      },
      {
        accessorKey: 'contractStartDate',
        header: 'Data rozpoczęcia umowy zatrudnienia',
        size: 200,
        filterVariant: 'date-range',
        accessorFn: (originalRow) => {
          const value = originalRow.contractStartDate;
          if (!value) return null;
          return dayjs(value);
        },
        Cell: ({ cell }) => {
          const value = cell.getValue<Dayjs | null>();
          if (!value) return '-';
          return value.format('DD.MM.YYYY');
        },
      },
      {
        accessorKey: 'a1StartDate',
        header: 'Data rozpoczęcia umowy A1',
        size: 200,
        filterVariant: 'date-range',
        accessorFn: (originalRow) => {
          const value = originalRow.a1StartDate;
          if (!value) return null;
          return dayjs(value);
        },
        Cell: ({ cell }) => {
          const value = cell.getValue<Dayjs | null>();
          if (!value) return '-';
          return value.format('DD.MM.YYYY');
        },
      },
    ],
    []
  );

  const tableData = useMemo(() => employees || [], [employees]);

  const table = useMaterialReactTable({
    localization,
    columns,
    data: tableData,
    layoutMode: 'grid',
    initialState: {
      columnOrder: [
        'mrt-row-numbers',
        'name',
        'email',
        'phone',
        'status',
        'contractStartDate',
        'a1StartDate',
        'mrt-row-actions',
      ],
      columnFilters: [
        {id: 'status', value: true}
      ]
    },
    state: {
      density,
      columnVisibility
    },
    onColumnVisibilityChange: setColumnVisibility,

    onDensityChange: setDensity,
    enableColumnResizing: true,
    renderTopToolbarCustomActions: () => (
      <Stack direction={'row'}>

      <Button
        variant="outlined"
        onClick={handleCreateClick}
        startIcon={<AddIcon />}
        size="small"
        sx={{ mx: 1, my: 0.5, minWidth: 'fit-content' }}
      >
        Nowa
      </Button>
      </Stack>
    ),
    renderToolbarInternalActions: ({ table }) => (
      <Stack direction="row" alignItems="center" spacing={1}>
        <MRT_ToggleGlobalFilterButton table={table} />
        <MRT_ToggleFiltersButton table={table} />
        <MRT_ShowHideColumnsButton table={table} />
        <MRT_ToggleDensePaddingButton table={table} />
        <Tooltip title="Resetuj stan tabeli">
          <IconButton onClick={()=>{}}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    ),
    rowNumberDisplayMode: 'static',
    enableRowActions: true,
    renderRowActions: ({ row }) => (
      <IconButton onClick={() => navigate(`/employees/${row.original.id}`)}>
        <VisibilityIcon />
      </IconButton>
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
        fontWeight: 'bold',
        color: '#374151',
      },
    },
    muiTableBodyRowProps: {
      sx: {
        '&:hover': {
          background: '#ffd85f30 !important',
        },
        'td:after': {
          display: 'none',
        },
      },
    },
    enableRowNumbers: true,
    displayColumnDefOptions: {
      'mrt-row-numbers': {
        // muiTableHeadCellProps: { sx: { py: '0.75rem' } },
        muiTableBodyCellProps: { align: 'center' },
      },
      'mrt-row-actions': {
        grow: false,
      },
    },
    renderBottomToolbar: ({ table }) => (
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        // className="px-2"
        // sx={{
        //   '& .MuiTablePagination-root': {
        //     flexDirection: { xs: 'column', md: 'row' },
        //   },
        // }}
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
      <PageContainer title={t('employees.employeesList')}>
        <CircularProgress />
        <Typography
          variant="body2"
          sx={{ mt: 2, ml: 2, color: 'text.secondary' }}
        >
          Trwa ładowanie listy pracowników...
        </Typography>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title={t('employees.employeesList')}>
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
    >
      <Box sx={{ flex: 1, width: '100%' }}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
          <MaterialReactTable table={table} />
        </LocalizationProvider>
      </Box>
    </PageContainer>
  );
}
