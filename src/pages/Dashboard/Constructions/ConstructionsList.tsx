import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/PageContainer';
import { useTranslation } from 'react-i18next';
import { getConstructionList } from '../../../api/constructions';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_DensityState,
  type MRT_SortingState,
  type MRT_VisibilityState,
} from 'material-react-table';
import type { Construction } from '../../../types';
import 'dayjs/locale/pl';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { MRT_Localization_PL } from 'material-react-table/locales/pl';

import VisibilityIcon from '@mui/icons-material/Visibility';

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
    () => {
      const item = safeParse('mrt_columnFilters_table_1', []);
      // Konwertuj stringi na Day.js dla filtrów daty
      return item.map((filter: any) => {
        if (filter.id === 'startDate' && Array.isArray(filter.value)) {
          return {
            ...filter,
            value: filter.value.map((v: any) => (v ? dayjs(v) : null)),
          };
        }
        return filter;
      });
    }
  );

  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(
    () => safeParse('mrt_columnVisibility_table_1', {})
  );

  const [density, setDensity] = useState<MRT_DensityState>(() =>
    safeParse('mrt_density_table_1', 'comfortable')
  );

  const [globalFilter, setGlobalFilter] = useState<string | undefined>(() => {
    const item = safeParse('mrt_globalFilter_table_1', '');
    return item || undefined;
  });

  const [showGlobalFilter, setShowGlobalFilter] = useState<boolean>(() =>
    safeParse('mrt_showGlobalFilter_table_1', false)
  );

  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(() =>
    safeParse('mrt_showColumnFilters_table_1', false)
  );

  const [sorting, setSorting] = useState<MRT_SortingState>(() =>
    safeParse('mrt_sorting_table_1', [])
  );

  // Zapisywanie stanu do sessionStorage
  useEffect(() => {
    // Konwertuj Day.js na string przed zapisaniem
    const filtersToSave = columnFilters.map((filter) => {
      if (filter.id === 'startDate' && Array.isArray(filter.value)) {
        return {
          ...filter,
          value: filter.value.map((v: any) => (v ? v.format() : null)),
        };
      }
      return filter;
    });

    sessionStorage.setItem(
      'mrt_columnFilters_table_1',
      JSON.stringify(filtersToSave)
    );
  }, [columnFilters]);

  useEffect(() => {
    sessionStorage.setItem(
      'mrt_columnVisibility_table_1',
      JSON.stringify(columnVisibility)
    );
  }, [columnVisibility]);

  useEffect(() => {
    sessionStorage.setItem('mrt_density_table_1', JSON.stringify(density));
  }, [density]);

  useEffect(() => {
    sessionStorage.setItem(
      'mrt_globalFilter_table_1',
      JSON.stringify(globalFilter ?? '')
    );
  }, [globalFilter]);

  useEffect(() => {
    sessionStorage.setItem(
      'mrt_showGlobalFilter_table_1',
      JSON.stringify(showGlobalFilter)
    );
  }, [showGlobalFilter]);

  useEffect(() => {
    sessionStorage.setItem(
      'mrt_showColumnFilters_table_1',
      JSON.stringify(showColumnFilters)
    );
  }, [showColumnFilters]);

  useEffect(() => {
    sessionStorage.setItem('mrt_sorting_table_1', JSON.stringify(sorting));
  }, [sorting]);

  const resetState = () => {
    sessionStorage.removeItem('mrt_columnFilters_table_1');
    sessionStorage.removeItem('mrt_columnVisibility_table_1');
    sessionStorage.removeItem('mrt_density_table_1');
    sessionStorage.removeItem('mrt_globalFilter_table_1');
    sessionStorage.removeItem('mrt_showGlobalFilter_table_1');
    sessionStorage.removeItem('mrt_showColumnFilters_table_1');
    sessionStorage.removeItem('mrt_sorting_table_1');

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

export default function ConstructionsList() {
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['constructions'],
    queryFn: getConstructionList,
  });

  const handleCreateClick = React.useCallback(() => {
    navigate('/constructions/create');
  }, [navigate]);

  const dateBetweenFilterFn = (row, columnId, filterValue) => {
    if (!filterValue || !Array.isArray(filterValue)) {
      return true;
    }

    const [start, end] = filterValue;
    const rowValue = row.getValue(columnId);

    if (!rowValue) {
      return false;
    }

    const rowDate = dayjs.isDayjs(rowValue) ? rowValue : dayjs(rowValue);
    if (!rowDate.isValid()) {
      return false;
    }

    const startDate = start ? dayjs(start).startOf('day') : null;
    const endDate = end ? dayjs(end).endOf('day') : null; // Używamy endOf dla daty końcowej

    const rowTimestamp = rowDate.valueOf();

    if (startDate && endDate) {
      return (
        rowTimestamp >= startDate.valueOf() && rowTimestamp <= endDate.valueOf()
      );
    } else if (startDate) {
      return rowTimestamp >= startDate.valueOf();
    } else if (endDate) {
      return rowTimestamp <= endDate.valueOf();
    }

    return true;
  };

  const columns = useMemo<MRT_ColumnDef<Construction>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nazwa',
        size: 150,
      },
      {
        accessorKey: 'location',
        header: 'Adres',
        size: 150,
      },
      {
        accessorKey: 'contractor',
        header: 'Wykonawca',
        size: 200,
      },
      {
        accessorKey: 'startDate',
        header: 'Data rozpoczęcia',
        size: 200,
        filterVariant: 'date-range',
        accessorFn: (originalRow) => {
          const value = originalRow.startDate;
          if (!value) return null;
          return dayjs(value).startOf('day'); // Ustaw na początek dnia
        },
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
      },
      {
        accessorKey: 'inProgress',
        header: 'Status',
        filterSelectOptions: [
          { text: 'W trakcie', value: 'true' },
          { text: 'Zakończona', value: 'false' },
        ],
        Cell: ({ cell }) => (
          <Box
            component="span"
            className={`rounded px-3 py-1 ${
              cell.getValue<boolean>() ? 'bg-blue-400/50' : 'bg-amber-400/50'
            }`}
          >
            {cell.getValue<boolean>() ? 'W trakcie' : 'Zakończona'}
          </Box>
        ),
        size: 125,
      },
    ],
    []
  );

  const tableData = useMemo(() => data || [], [data]);

  return (
    <PageContainer
      title={t('constructions.constructionsList')}
      breadcrumbs={[{ title: t('constructions.constructions') }]}
      actions={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button
            variant="contained"
            onClick={handleCreateClick}
            startIcon={<AddIcon />}
          >
            {t('constructions.newConstruction')}
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
            state={{
              columnFilters,
              columnVisibility,
              density,
              globalFilter,
              showColumnFilters,
              showGlobalFilter,
              sorting,
              isLoading,
            }}
            onColumnFiltersChange={setColumnFilters}
            onColumnVisibilityChange={setColumnVisibility}
            onDensityChange={setDensity}
            onGlobalFilterChange={setGlobalFilter}
            onShowColumnFiltersChange={setShowColumnFilters}
            onShowGlobalFilterChange={setShowGlobalFilter}
            onSortingChange={setSorting}
            enableColumnResizing={false}
            rowNumberDisplayMode="static"
            renderBottomToolbarCustomActions={() => (
              <Button onClick={resetState}>Resetuj</Button>
            )}
            enableRowActions
            renderRowActions={(table) => (
              <IconButton
                onClick={() =>
                  navigate(`/constructions/${table.row.original.id}`)
                }
              >
                <VisibilityIcon />
              </IconButton>
            )}
            muiTablePaperProps={{
              sx: {
                boxShadow: 'none',
                border: '1px solid #e0e0e0',
                borderRadius: '10px',
              },
            }}
            muiTableHeadCellProps={{
              sx: {
                borderTop: '1px solid #e0e0e0',
                fontWeight: 'bold',
                color: '#374151',
              },
            }}
            muiTableBodyRowProps={{
              sx: {
                '&:hover': {
                  background: 'white !important',
                },
              },
            }}
          />
        </LocalizationProvider>
      </Box>
    </PageContainer>
  );
}
