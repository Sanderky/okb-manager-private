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
import { getConstructionList } from '../../../api/constructions';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  MaterialReactTable,
  MRT_ShowHideColumnsButton,
  MRT_TablePagination,
  MRT_ToggleDensePaddingButton,
  MRT_ToggleGlobalFilterButton,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import type { Construction } from '../../../types';
import 'dayjs/locale/pl';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { MRT_Localization_PL } from 'material-react-table/locales/pl';
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
  Typography,
  FormLabel,
  Alert,
  Badge,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CloseIcon from '@mui/icons-material/Close';

interface Filters {
  name: string;
  contractor: string;
  location: string;
  startDateFrom: Dayjs | null;
  startDateTo: Dayjs | null;
  endDateFrom: Dayjs | null;
  endDateTo: Dayjs | null;
  inProgress: string;
}

export default function ConstructionsList() {
  const navigate = useNavigate();
  const {
    setColumnVisibility,
    setDensity,
    columnVisibility,
    density,
    resetState,
  } = useTableState('constructions');

  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [filtersActive, setFiltersActive] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    name: '',
    contractor: '',
    location: '',
    startDateFrom: null,
    startDateTo: null,
    endDateFrom: null,
    endDateTo: null,
    inProgress: 'true',
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['constructions'],
    queryFn: () => getConstructionList(),
  });

  const handleCreateClick = React.useCallback(() => {
    navigate('/constructions/create');
  }, [navigate]);

  const handleRowClick = React.useCallback(
    (row: any) => {
      navigate(`/constructions/${row.original.id}`);
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
    setFiltersActive(true);

    if (filters.name) {
      columnFilters.push({ id: 'name', value: filters.name });
    }

    if (filters.contractor) {
      columnFilters.push({ id: 'contractor', value: filters.contractor });
    }

    if (filters.location) {
      columnFilters.push({ id: 'location', value: filters.location });
    }

    if (filters.startDateFrom || filters.startDateTo) {
      columnFilters.push({
        id: 'startDate',
        value: [filters.startDateFrom, filters.startDateTo],
      });
    }

    if (filters.endDateFrom || filters.endDateTo) {
      columnFilters.push({
        id: 'endDate',
        value: [filters.endDateFrom, filters.endDateTo],
      });
    }

    if (filters.inProgress) {
      columnFilters.push({ id: 'inProgress', value: filters.inProgress });
    }

    table.setColumnFilters(columnFilters);
    handleCloseFilters();
  };

  const handleResetFilters = () => {
    setFiltersActive(false);

    setFilters({
      name: '',
      contractor: '',
      location: '',
      startDateFrom: null,
      startDateTo: null,
      endDateFrom: null,
      endDateTo: null,
      inProgress: '',
    });
    table.setColumnFilters([]);
  };

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

  const columns = useMemo<MRT_ColumnDef<Construction>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nazwa',
      },
      {
        accessorKey: 'contractor',
        header: 'Wykonawca',
      },
      {
        accessorKey: 'location',
        header: 'Adres',
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
        maxSize: 140,
      },
      {
        accessorKey: 'endDate',
        header: 'Data zakończenia',
        filterVariant: 'date-range',
        accessorFn: (originalRow) => {
          const value = originalRow.endDate;
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
        id: 'inProgress',
        header: 'Status',
        accessorFn: (row) => !row.endDate,
        filterVariant: 'select',
        filterSelectOptions: [
          { label: 'W trakcie', value: 'true' },
          { label: 'Zakończone', value: 'false' },
          { label: 'Wszystkie', value: '' },
        ],
        filterFn: (row: any, _columnId: string, filterValue: string) => {
          if (!filterValue) return true;
          const isInProgress = !row.original.endDate;
          return String(isInProgress) === filterValue;
        },
        Cell: ({ cell }) => (
          <Box
            component="span"
            className={`rounded px-3 py-1 ${
              cell.getValue<boolean>()
                ? 'bg-blue-400/50 text-blue-800'
                : 'bg-amber-400/50 text-amber-800'
            }`}
          >
            {cell.getValue<boolean>() ? 'W trakcie' : 'Zakończona'}
          </Box>
        ),
        maxSize: 140,
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
    layoutMode: 'semantic',
    initialState: {
      density: 'comfortable',
      columnOrder: [
        'mrt-row-numbers',
        'name',
        'inProgress',
        'contractor',
        'location',
        'startDate',
        'endDate',
      ],
      columnFilters: [{ id: 'inProgress', value: 'true' }],
    },
    state: {
      columnVisibility,
      density,
      isLoading: isLoading,
    },
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
            badgeContent={filtersActive ? 1 : 0}
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
    muiTableContainerProps: {
      sx: {
        '& *': {
          transition: 'none !important',
        },
      },
    },
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
    muiTableBodyRowProps: ({ row }) => {
      return {
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
      };
    },
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
          sx: { borderLeft: 'none' },
        },
        size: 50,
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

  if (error) {
    return (
      <PageContainer breadcrumbs={[{ title: 'Lista budów' }]}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Ponów próbę
            </Button>
          }
        >
          Wystąpił błąd podczas ładowania listy budów.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      breadcrumbs={[{ title: 'Lista budów' }]}
      actions={
        <Button
          variant="contained"
          onClick={handleCreateClick}
          startIcon={<AddIcon />}
          size="small"
          sx={{ mx: 1, my: 0.5, minWidth: 'fit-content' }}
        >
          Nowa
        </Button>
      }
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
                <Typography variant="h6">Filtry budów</Typography>
                <IconButton onClick={handleCloseFilters}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent dividers className="p-3 sm:p-5">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormLabel className="mb-2 block">Nazwa</FormLabel>
                  <TextField
                    size="small"
                    fullWidth
                    value={filters.name}
                    onChange={(e) =>
                      setFilters({ ...filters, name: e.target.value })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormLabel className="mb-2 block">Wykonawca</FormLabel>
                  <TextField
                    size="small"
                    fullWidth
                    value={filters.contractor}
                    onChange={(e) =>
                      setFilters({ ...filters, contractor: e.target.value })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormLabel className="mb-2 block">Adres</FormLabel>
                  <TextField
                    size="small"
                    fullWidth
                    value={filters.location}
                    onChange={(e) =>
                      setFilters({ ...filters, location: e.target.value })
                    }
                  />
                </Grid>

                {/* Zakres daty rozpoczęcia */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormLabel className="mb-2 block">Data rozpoczęcia</FormLabel>
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
                      value={filters.startDateFrom}
                      onChange={(newValue) =>
                        setFilters({ ...filters, startDateFrom: newValue })
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
                      value={filters.startDateTo}
                      onChange={(newValue) =>
                        setFilters({ ...filters, startDateTo: newValue })
                      }
                      slotProps={{
                        textField: { fullWidth: true, size: 'small' },
                      }}
                    />
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormLabel className="mb-2 block">Data zakończenia</FormLabel>
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
                      value={filters.endDateFrom}
                      onChange={(newValue) =>
                        setFilters({ ...filters, endDateFrom: newValue })
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
                      value={filters.endDateTo}
                      onChange={(newValue) =>
                        setFilters({ ...filters, endDateTo: newValue })
                      }
                      slotProps={{
                        textField: { fullWidth: true, size: 'small' },
                      }}
                    />
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <FormLabel className="mb-2 block">Status</FormLabel>
                    <Select
                      size="small"
                      value={filters.inProgress}
                      displayEmpty
                      onChange={(e) =>
                        setFilters({ ...filters, inProgress: e.target.value })
                      }
                    >
                      <MenuItem value="">Wszystkie</MenuItem>
                      <MenuItem value="true">W trakcie</MenuItem>
                      <MenuItem value="false">Zakończone</MenuItem>
                    </Select>
                  </FormControl>
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
