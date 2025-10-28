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
import { useMemo } from 'react';
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
import type { Construction } from '../../../types';
import 'dayjs/locale/pl';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { MRT_Localization_PL } from 'material-react-table/locales/pl';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTableState } from '../../../hooks/useTableSettings';

export default function ConstructionsList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    setColumnVisibility,
    setDensity,
    columnVisibility,
    density,
    resetState,
  } = useTableState('constructions');

  const { data, isLoading, error } = useQuery({
    queryKey: ['constructions'],
    queryFn: () => getConstructionList(),
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
        maxSize: 200,
        grow: true,
      },
      {
        accessorKey: 'location',
        header: 'Adres',
        grow: false,
      },
      {
        accessorKey: 'contractor',
        header: 'Wykonawca',
        grow: false,
      },
      {
        accessorKey: 'startDate',
        header: 'Data rozpoczęcia',
        filterVariant: 'date-range',
        accessorFn: (originalRow) => {
          const value = originalRow.startDate;
          if (!value) return null;
          return dayjs(value).startOf('day');
        },
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
        grow: false,
      },
      {
        id: 'inProgress',
        header: 'Status',
        accessorFn: (row) => !row.endDate,
        filterVariant: 'select',
        filterSelectOptions: [
          { label: 'W trakcie', value: 'true' },
          { label: 'Zakończone', value: 'false' },
          { label: 'Wszystkie', value: '' },
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
        grow: false,
      },
    ],
    []
  );

  const localization = React.useMemo(
    () => ({ ...MRT_Localization_PL, rowNumber: 'Lp.' }),
    []
  );

  const tableData = useMemo(() => data || [], [data]);

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
        'contractor',
        'location',
        'startDate',
        'inProgress',
        'mrt-row-actions',
      ],
      columnFilters: [{ id: 'inProgress', value: 'true' }],
    },
    state: {
      columnVisibility,
      density,
      isLoading,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onDensityChange: setDensity,
    enableColumnResizing: true,
    renderTopToolbarCustomActions: () => (
      <Button
        variant="outlined"
        onClick={handleCreateClick}
        startIcon={<AddIcon />}
        size="small"
        sx={{ mx: 1, my: 0.5, minWidth: 'fit-content' }}
      >
        Nowa
      </Button>
    ),
    renderToolbarInternalActions: ({ table }) => (
      <Stack direction="row" alignItems="center" spacing={1}>
        <MRT_ToggleGlobalFilterButton table={table} />
        <MRT_ToggleFiltersButton table={table} />
        <MRT_ShowHideColumnsButton table={table} />
        <MRT_ToggleDensePaddingButton table={table} />
        <Tooltip title="Resetuj stan tabeli">
          <IconButton onClick={resetState}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    ),
    rowNumberDisplayMode: 'static',
    enableRowActions: true,
    renderRowActions: ({ row }) => (
      <IconButton onClick={() => navigate(`/constructions/${row.original.id}`)}>
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

  return (
    <PageContainer
      title={t('constructions.constructionsList')}
      breadcrumbs={[{ title: t('constructions.constructions') }]}
      actions={<Stack direction="row" alignItems="center" spacing={1}></Stack>}
    >
      <Box sx={{ flex: 1, width: '100%' }}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
          <MaterialReactTable table={table} />
        </LocalizationProvider>
      </Box>
    </PageContainer>
  );
}
