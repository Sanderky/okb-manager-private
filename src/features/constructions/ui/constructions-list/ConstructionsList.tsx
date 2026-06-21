import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import {
  MaterialReactTable,
  MRT_ShowHideColumnsButton,
  MRT_ToggleDensePaddingButton,
  MRT_ToggleGlobalFilterButton,
  useMaterialReactTable,
} from 'material-react-table';
import 'dayjs/locale/pl';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MRT_Localization_PL } from 'material-react-table/locales/pl';
import { Badge } from '@mui/material';
import { plPL } from '@mui/x-date-pickers/locales';
import { TablePagination } from '@/shared/ui/TablePagination';
import { useConstructionsListContext } from '../../model/providers/ConstructionsListContext';
import { FiltersDialog } from './ConstructionsListFilters';

export function ConstructionsList() {
  const {
    columns,
    tableData,
    isLoading,
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
  } = useConstructionsListContext();

  const localization = React.useMemo(
    () => ({ ...MRT_Localization_PL, rowNumber: 'Lp.' }),
    []
  );

  const table = useMaterialReactTable({
    localization,
    autoResetPageIndex: false,
    columns,
    data: tableData,
    layoutMode: 'semantic',
    enableStickyHeader: true,
    state: {
      columnFilters: tableState.columnFilters,
      columnVisibility: tableState.columnVisibility,
      density: tableState.density,
      isLoading: isLoading,
      pagination: tableState.pagination,
      columnOrder: tableState.columnOrder,
    },
    onPaginationChange: tableState.setPagination,
    onColumnOrderChange: tableState.setColumnOrder,
    onColumnVisibilityChange: tableState.setColumnVisibility,
    onDensityChange: tableState.setDensity,
    enableColumnFilters: false,
    enableColumnActions: false,
    enableColumnOrdering: true,
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
            <IconButton onClick={() => setFiltersModalOpen(true)}>
              <FilterListIcon />
            </IconButton>
          </Badge>
        </Tooltip>
        <MRT_ShowHideColumnsButton table={table} />
        <MRT_ToggleDensePaddingButton table={table} />
        <Tooltip title="Resetuj stan tabeli">
          <IconButton onClick={tableState.resetState}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    ),
    muiTableContainerProps: {
      sx: {
        minHeight: 0,
        backgroundColor: 'background.default',
        overflowY: 'auto',
        flex: '1 1 auto',
        '& *': { transition: 'none !important' },
      },
    },
    muiTopToolbarProps: {
      sx: (theme) => ({ backgroundColor: theme.palette.background.paper }),
    },
    muiTablePaperProps: {
      sx: {
        boxShadow: 'none',
        borderRadius: '0',
        borderLeft: 'none !important',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      },
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
        '&:hover': { background: `${theme.palette.tableHover} !important` },
        'td:after': { display: 'none' },
      }),
    }),
    muiTableHeadRowProps: {
      sx: { boxShadow: 'none !important', backgroundImage: 'none !important' },
    },
    enableRowNumbers: true,
    displayColumnDefOptions: {
      'mrt-row-numbers': {
        muiTableBodyCellProps: { align: 'center', sx: { borderLeft: 'none' } },
        size: 50,
        enableResizing: false,
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
      <Box sx={{ flexShrink: 0, minHeight: '45px' }}>
        <TablePagination table={table} />
      </Box>
      <FiltersDialog
        filtersModalOpen={filtersModalOpen}
        setFilters={setFilters}
        filters={filters}
        handleApplyFilters={handleApplyFilters}
        handleCloseFilters={handleCloseFilters}
        handleCloseAndReset={handleCloseAndReset}
        contractorOptions={contractorOptions}
      />
    </LocalizationProvider>
  );
}
