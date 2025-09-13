import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/PageContainer';
import { useTranslation } from 'react-i18next';
import { getEmployees } from '../../../api/employees';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_DensityState,
  type MRT_SortingState,
  type MRT_VisibilityState,
} from 'material-react-table';
import type { Employee } from '../../../types';
import 'dayjs/locale/pl';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import { MRT_Localization_PL } from 'material-react-table/locales/pl';

const TABLE_STATE_PREFIX = 'mrt_employees_table';

const useTableState = () => {
  const safeParse = (key: string, defaultValue: any) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    () => safeParse(`${TABLE_STATE_PREFIX}_columnFilters`, [])
  );

  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(
    () => safeParse(`${TABLE_STATE_PREFIX}_columnVisibility`, {})
  );

  const [density, setDensity] = useState<MRT_DensityState>(() =>
    safeParse(`${TABLE_STATE_PREFIX}_density`, 'comfortable')
  );

  const [globalFilter, setGlobalFilter] = useState<string | undefined>(() =>
    safeParse(`${TABLE_STATE_PREFIX}_globalFilter`, '')
  );

  const [showGlobalFilter, setShowGlobalFilter] = useState<boolean>(() =>
    safeParse(`${TABLE_STATE_PREFIX}_showGlobalFilter`, false)
  );

  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(() =>
    safeParse(`${TABLE_STATE_PREFIX}_showColumnFilters`, false)
  );

  const [sorting, setSorting] = useState<MRT_SortingState>(() =>
    safeParse(`${TABLE_STATE_PREFIX}_sorting`, [])
  );

  useEffect(() => {
    sessionStorage.setItem(
      `${TABLE_STATE_PREFIX}_columnFilters`,
      JSON.stringify(columnFilters)
    );
  }, [columnFilters]);

  useEffect(() => {
    sessionStorage.setItem(
      `${TABLE_STATE_PREFIX}_columnVisibility`,
      JSON.stringify(columnVisibility)
    );
  }, [columnVisibility]);

  useEffect(() => {
    sessionStorage.setItem(
      `${TABLE_STATE_PREFIX}_density`,
      JSON.stringify(density)
    );
  }, [density]);

  useEffect(() => {
    sessionStorage.setItem(
      `${TABLE_STATE_PREFIX}_globalFilter`,
      JSON.stringify(globalFilter ?? '')
    );
  }, [globalFilter]);

  useEffect(() => {
    sessionStorage.setItem(
      `${TABLE_STATE_PREFIX}_showGlobalFilter`,
      JSON.stringify(showGlobalFilter)
    );
  }, [showGlobalFilter]);

  useEffect(() => {
    sessionStorage.setItem(
      `${TABLE_STATE_PREFIX}_showColumnFilters`,
      JSON.stringify(showColumnFilters)
    );
  }, [showColumnFilters]);

  useEffect(() => {
    sessionStorage.setItem(
      `${TABLE_STATE_PREFIX}_sorting`,
      JSON.stringify(sorting)
    );
  }, [sorting]);

  const resetState = () => {
    sessionStorage.removeItem(`${TABLE_STATE_PREFIX}_columnFilters`);
    sessionStorage.removeItem(`${TABLE_STATE_PREFIX}_columnVisibility`);
    sessionStorage.removeItem(`${TABLE_STATE_PREFIX}_density`);
    sessionStorage.removeItem(`${TABLE_STATE_PREFIX}_globalFilter`);
    sessionStorage.removeItem(`${TABLE_STATE_PREFIX}_showGlobalFilter`);
    sessionStorage.removeItem(`${TABLE_STATE_PREFIX}_showColumnFilters`);
    sessionStorage.removeItem(`${TABLE_STATE_PREFIX}_sorting`);

    setColumnFilters([]);
    setColumnVisibility({});
    setDensity('comfortable');
    setGlobalFilter(undefined);
    setShowColumnFilters(false);
    setShowGlobalFilter(false);
    setSorting([]);
  };

  return {
    setColumnFilters,
    setColumnVisibility,
    setDensity,
    setGlobalFilter,
    setShowColumnFilters,
    setShowGlobalFilter,
    setSorting,
    columnFilters,
    columnVisibility,
    density,
    globalFilter,
    showColumnFilters,
    showGlobalFilter,
    sorting,
    resetState,
  };
};

export default function EmployeeList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    setColumnFilters,
    setColumnVisibility,
    setDensity,
    setGlobalFilter,
    setShowColumnFilters,
    setShowGlobalFilter,
    setSorting,
    columnFilters,
    columnVisibility,
    density,
    globalFilter,
    showColumnFilters,
    showGlobalFilter,
    sorting,
    resetState,
  } = useTableState();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const handleCreateClick = React.useCallback(() => {
    navigate('/employees/create');
  }, [navigate]);

  const columns = useMemo<MRT_ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Imię i Nazwisko',
        size: 250,
      },
      {
        accessorKey: 'position',
        header: 'Stanowisko',
        size: 200,
      },
      {
        accessorKey: 'email',
        header: 'E-mail',
        size: 250,
      },
      {
        accessorKey: 'phone',
        header: 'Telefon',
        size: 150,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 150,
      },
      {
        accessorKey: 'hireDate',
        header: 'Data zatrudnienia',
        size: 200,
        filterVariant: 'date-range',
        accessorFn: (originalRow) => {
          const value = originalRow.hireDate;
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

  const tableData = useMemo(() => data || [], [data]);

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
      actions={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button
            variant="contained"
            onClick={handleCreateClick}
            startIcon={<AddIcon />}
          >
            Dodaj pracownika
          </Button>
        </Stack>
      }
    >
      <Box sx={{ flex: 1, width: '100%' }}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
          <MaterialReactTable
            localization={MRT_Localization_PL}
            columns={columns}
            data={tableData}
            enableColumnResizing={false}
            enableRowNumbers
            rowNumberDisplayMode="static"
            renderBottomToolbarCustomActions={() => (
              <Button onClick={resetState}>Resetuj</Button>
            )}
            enableRowActions
            renderRowActions={({ row }) => (
              <Button onClick={() => navigate(`/employees/${row.original.id}`)}>
                Pokaż
              </Button>
            )}
          />
        </LocalizationProvider>
      </Box>
    </PageContainer>
  );
}
