import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import WarningIcon from '@mui/icons-material/Warning';
import {
  MaterialReactTable,
  MRT_ShowHideColumnsButton,
  MRT_ToggleDensePaddingButton,
  MRT_ToggleGlobalFilterButton,
  useMaterialReactTable,
} from 'material-react-table';
import { Badge, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { TablePagination } from '@/shared/ui/TablePagination';
import { useEmployeeListContext } from '../../model/providers/useEmployeesListContext';
import { FiltersDialog } from './EmployeesListFilters';
import { useMaterialTableLanguage } from '@/shared/lib/useMaterialTableLanguage';

export function EmployeeList() {
  const { t } = useTranslation('employees');
  const tableLocalizationConfig = useMaterialTableLanguage();

  const {
    columns,
    tableData,
    isLoading,
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
    alertsMap
  } = useEmployeeListContext();

  const localization = React.useMemo(
    () => ({ ...tableLocalizationConfig, rowNumber: 'Lp.' }),
    [tableLocalizationConfig]
  );

  const table = useMaterialReactTable({
    localization,
    columns,
    data: tableData,
    autoResetPageIndex: false,
    layoutMode: 'semantic',
    state: {
      columnFilters: tableState.columnFilters,
      columnVisibility: tableState.columnVisibility,
      density: tableState.density,
      isLoading,
      pagination: tableState.pagination,
      columnOrder: tableState.columnOrder,
    },
    enableStickyHeader: true,
    muiTableContainerProps: {
      sx: {
        backgroundColor: 'background.default',
        flex: '1 1 auto',
        minHeight: 0,
        overflowY: 'auto',
        '& *': { transition: 'none !important' },
      },
    },
    onColumnFiltersChange: tableState.setColumnFilters,
    onPaginationChange: tableState.setPagination,
    onColumnVisibilityChange: tableState.setColumnVisibility,
    onDensityChange: tableState.setDensity,
    onColumnOrderChange: tableState.setColumnOrder,
    enableColumnFilters: false,
    enableColumnOrdering: true,
    enableColumnResizing: true,
    enableColumnActions: false,
    renderToolbarInternalActions: ({ table }) => (
      <Stack direction="row" alignItems="center" spacing={1}>
        <MRT_ToggleGlobalFilterButton table={table} />
        <Tooltip title={t('list.table.tooltips.filters')}>
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
        <Tooltip title={t('list.table.tooltips.reset')}>
          <IconButton onClick={tableState.resetState}>
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
      sx: (theme) => ({ backgroundColor: theme.palette.background.paper }),
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
        muiTableBodyCellProps: {
          align: 'center',
          sx: { borderLeft: 'none', padding: 0 },
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
                  title={t('list.table.alerts', { count: employeeAlerts.length })}
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
    <>
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
      />
    </>
  );
}
