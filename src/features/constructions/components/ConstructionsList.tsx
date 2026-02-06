import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate, useSearchParams } from 'react-router';
import PageContainer from '../../../shared/ui/PageContainer';
import { getConstructionList } from '../../../api/constructions';
import { useQuery } from '@tanstack/react-query';
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
import dayjs, { Dayjs } from 'dayjs';
import { MRT_Localization_PL } from 'material-react-table/locales/pl';
import { useFormFilters, useTableState } from '../../../shared/lib/useTableSettings';
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
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CloseIcon from '@mui/icons-material/Close';
import { plPL } from '@mui/x-date-pickers/locales';
import { getEmployeesByScheduledConstruction } from '../../../api/schedules';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { ContractorsDialog } from '../../contractors/components/ContractorsDialog';
import { Engineering } from '@mui/icons-material';
import { getContractors } from '../../../api/contractors';
import { TablePagination } from '../../../shared/ui/TablePagination';
import Loading from '../../../shared/ui/Loading';
import type { Construction } from '../../../entities/constructions';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface ConstructionsFilters {
  name: string;
  contractor: string;
  location: string;
  startDateFrom: Dayjs | null;
  startDateTo: Dayjs | null;
  endDateFrom: Dayjs | null;
  endDateTo: Dayjs | null;
  status: string;
  employeeCountMin: string;
  employeeCountMax: string;
}

const DefaultFiltersState: ConstructionsFilters = {
  name: '',
  contractor: '',
  location: '',
  startDateFrom: null,
  startDateTo: null,
  endDateFrom: null,
  endDateTo: null,
  status: 'true',
  employeeCountMin: '',
  employeeCountMax: '',
};

const DefaultColumnFilters = [{ id: 'status', value: 'true' }];

const DefaultColumnsOrder = [
  'mrt-row-numbers',
  'name',
  'status',
  'employeeCount',
  'contractor',
  'location',
  'startDate',
  'endDate',
];

interface FiltersDialogProps {
  filtersModalOpen: boolean;
  handleCloseFilters: () => void;
  filters: ConstructionsFilters;
  setFilters: (val: ConstructionsFilters) => void;
  handleCloseAndReset: () => void;
  handleApplyFilters: () => void;
  contractorOptions: {
    label: string;
    id: string;
  }[];
}

const FiltersDialog = ({
  filtersModalOpen,
  handleCloseFilters,
  filters,
  setFilters,
  handleApplyFilters,
  handleCloseAndReset,
  contractorOptions,
}: FiltersDialogProps) => {
  return (
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
              value={filters.name ?? ''}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormLabel className="mb-2 block">Wykonawca</FormLabel>
            <Autocomplete
              options={contractorOptions}
              getOptionLabel={(option) => option.label || ''}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={
                filters.contractor
                  ? contractorOptions.find(
                      (opt) => opt.label === filters.contractor
                    ) || null
                  : null
              }
              onChange={(_, newValue) => {
                setFilters({
                  ...filters,
                  contractor: newValue ? newValue.label : '',
                });
              }}
              size="small"
              renderInput={(params) => (
                <TextField {...params} size="small" fullWidth />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormLabel className="mb-2 block">Adres</FormLabel>
            <TextField
              size="small"
              fullWidth
              value={filters.location ?? ''}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
            />
          </Grid>

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
                openTo="month"
                views={['year', 'month', 'day']}
                value={filters.startDateFrom ?? null}
                onChange={(newValue) =>
                  setFilters({ ...filters, startDateFrom: newValue })
                }
                slotProps={{
                  field: {
                    clearable: true,
                    onClear: () =>
                      setFilters({
                        ...filters,
                        startDateFrom: null,
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
                value={filters.startDateTo ?? null}
                onChange={(newValue) =>
                  setFilters({ ...filters, startDateTo: newValue })
                }
                slotProps={{
                  field: {
                    clearable: true,
                    onClear: () =>
                      setFilters({
                        ...filters,
                        startDateTo: null,
                      }),
                  },
                  textField: {
                    fullWidth: true,
                    size: 'small',
                  },
                }}
                minDate={filters.startDateFrom || undefined}
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
                openTo="month"
                views={['year', 'month', 'day']}
                value={filters.endDateFrom ?? null}
                onChange={(newValue) =>
                  setFilters({ ...filters, endDateFrom: newValue })
                }
                slotProps={{
                  field: {
                    clearable: true,
                    onClear: () =>
                      setFilters({
                        ...filters,
                        endDateFrom: null,
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
                value={filters.endDateTo ?? null}
                onChange={(newValue) =>
                  setFilters({ ...filters, endDateTo: newValue })
                }
                slotProps={{
                  field: {
                    clearable: true,
                    onClear: () =>
                      setFilters({
                        ...filters,
                        endDateTo: null,
                      }),
                  },
                  textField: {
                    fullWidth: true,
                    size: 'small',
                  },
                }}
                minDate={filters.endDateFrom || undefined}
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormLabel className="mb-2 block">Liczba pracowników</FormLabel>
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
                fullWidth
                type="number"
                value={filters.employeeCountMin ?? ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    employeeCountMin: e.target.value,
                  })
                }
                slotProps={{
                  htmlInput: {
                    min: 0,
                  },
                }}
                label="Min."
              />
              <TextField
                size="small"
                fullWidth
                type="number"
                value={filters.employeeCountMax ?? ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    employeeCountMax: e.target.value,
                  })
                }
                slotProps={{
                  htmlInput: {
                    min: 0,
                  },
                }}
                label="Max."
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <FormLabel className="mb-2 block">Status</FormLabel>
              <Select
                size="small"
                value={filters.status ?? ''}
                displayEmpty
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
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
  );
};

export default function ConstructionsList() {
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
    isLoading: isSettingsLoading,
  } = useTableState('constructions', DefaultColumnFilters, DefaultColumnsOrder);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filtersModalOpen, setFiltersModalOpen] = useState(false);

  const { filters, setFilters, resetFilters } =
    useFormFilters<ConstructionsFilters>('constructions', DefaultFiltersState);

  const isFilterActive = useMemo(() => {
    return (
      JSON.stringify(columnFilters) !== JSON.stringify(DefaultColumnFilters)
    );
  }, [columnFilters]);

  const contractorsModalOpen =
    searchParams.get('view') === 'contractors' ||
    !!searchParams.get('contractorId');

  const handleOpenContractors = () => {
    setSearchParams((prev) => {
      prev.set('view', 'contractors');
      return prev;
    });
  };

  const handleCloseContractors = () => {
    setSearchParams((prev) => {
      prev.delete('view');
      prev.delete('contractorId');
      return prev;
    });
  };

  const {
    data: constructions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['constructions'],

    queryFn: () => getConstructionList(),
  });

  const { data: contractors } = useQuery({
    queryKey: ['contractors'],
    queryFn: getContractors,
  });

  const contractorOptions = useMemo(() => {
    if (!contractors || contractors.length === 0) return [];

    return contractors.map((contractor) => ({
      label: contractor.name,
      id: contractor.id,
    }));
  }, [contractors]);

  const { data: employeesData } = useQuery({
    queryKey: ['schedules', 'constructionEmployees'],
    queryFn: async () => {
      if (!constructions) return {};

      const employeeCounts: Record<string, number> = {};

      const consIds: string[] = constructions.map((c) => c.id);

      const employeesByConstruction = await getEmployeesByScheduledConstruction(
        consIds,
        dayjs().toDate()
      );

      employeesByConstruction.forEach((item) => {
        const activeEmployees = item.employees.filter(
          (employee) => employee.status
        );
        employeeCounts[item.constructionId] = activeEmployees.length;
      });

      constructions.forEach((construction) => {
        if (employeeCounts[construction.id] === undefined) {
          employeeCounts[construction.id] = 0;
        }
      });

      return employeeCounts;
    },
    enabled: !!constructions,
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

    if (filters.contractor) {
      columnFilters.push({ id: 'contractorName', value: filters.contractor });
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

    if (filters.status) {
      columnFilters.push({ id: 'status', value: filters.status });
    }

    if (filters.employeeCountMin || filters.employeeCountMax) {
      columnFilters.push({
        id: 'employeeCount',
        value: {
          min: filters.employeeCountMin
            ? parseInt(filters.employeeCountMin)
            : null,
          max: filters.employeeCountMax
            ? parseInt(filters.employeeCountMax)
            : null,
        },
      });
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

  const employeeCountFilterFn = (
    row: any,
    columnId: string,
    filterValue: any
  ) => {
    if (!filterValue || typeof filterValue !== 'object') return true;

    const { min, max } = filterValue;
    const rowValue = row.getValue(columnId);
    const employeeCount = rowValue || 0;

    if (min !== null && max !== null) {
      return employeeCount >= min && employeeCount <= max;
    } else if (min !== null) {
      return employeeCount >= min;
    } else if (max !== null) {
      return employeeCount <= max;
    }

    return true;
  };

  const columns = useMemo<
    MRT_ColumnDef<Construction & { employeeCount?: number }>[]
  >(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: 'Nazwa',
      },
      {
        id: 'contractorName',
        accessorKey: 'contractorName',
        header: 'Wykonawca',
        filterFn: 'equals',
      },
      {
        id: 'location',
        accessorKey: 'location',
        header: 'Adres',
      },
      {
        id: 'startDate',
        header: 'Data rozpoczęcia',
        filterVariant: 'date-range',
        accessorFn: (originalRow) => {
          const value = originalRow.startDate;
          if (!value) return null;
          return dayjs(value).startOf('day');
        },
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
        maxSize: 140,
      },
      {
        id: 'endDate',
        header: 'Data zakończenia',
        filterVariant: 'date-range',
        accessorFn: (originalRow) => {
          const value = originalRow.endDate;
          if (!value) return null;
          return dayjs(value).isValid() ? dayjs(value).startOf('day') : null;
        },
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
        maxSize: 140,
      },
      {
        id: 'employeeCount',
        header: 'Pracownicy dziś',
        accessorFn: (row) => employeesData?.[row.id] || 0,
        filterVariant: 'range',
        filterFn: employeeCountFilterFn,
        Cell: ({ cell }) => {
          const count = cell.getValue<number>();
          return (
            <Box
              component="span"
              className={`rounded-full px-2 py-1 font-medium`}
              sx={(theme) => ({
                color:
                  count > 0
                    ? theme.palette.status.employee.active.text
                    : theme.palette.text.secondary,
                background:
                  count > 0
                    ? theme.palette.status.employee.active.background
                    : theme.palette.background.default,
              })}
            >
              {count}
            </Box>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => row.status,
        filterVariant: 'select',
        filterSelectOptions: [
          { label: 'W trakcie', value: 'true' },
          { label: 'Zakończone', value: 'false' },
          { label: 'Wszystkie', value: '' },
        ],
        filterFn: (row: any, _columnId: string, filterValue: string) => {
          if (!filterValue) return true;
          const isActive = row.original.status;
          return String(isActive) === filterValue;
        },
        Cell: ({ cell }) => (
          <Box
            component="span"
            className={`rounded px-3 py-1`}
            sx={(theme) => ({
              background: cell.getValue<boolean>()
                ? theme.palette.status.construction.active.background
                : theme.palette.status.construction.inactive.background,
              color: cell.getValue<boolean>()
                ? theme.palette.status.construction.active.text
                : theme.palette.status.construction.inactive.text,
            })}
          >
            {cell.getValue<boolean>() ? 'W trakcie' : 'Zakończona'}
          </Box>
        ),
      },
    ],
    [employeesData]
  );

  const localization = React.useMemo(
    () => ({ ...MRT_Localization_PL, rowNumber: 'Lp.' }),
    []
  );

  const tableData = useMemo(() => {
    if (!constructions) return [];

    return constructions.map((construction) => ({
      ...construction,
      employeeCount: employeesData?.[construction.id] || 0,
    }));
  }, [constructions, employeesData]);

  const table = useMaterialReactTable({
    localization,
    autoResetPageIndex: false,
    columns,
    data: tableData,
    layoutMode: 'semantic',
    enableStickyHeader: true,
    state: {
      columnFilters,
      columnVisibility,
      density,
      isLoading: isLoading,
      pagination,
      columnOrder,
    },
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    onDensityChange: setDensity,
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
        minHeight: 0,
        backgroundColor: 'background.default',
        overflowY: 'auto',
        flex: '1 1 auto',
        '& *': {
          transition: 'none !important',
        },
      },
    },
    muiTopToolbarProps: {
      sx: (theme) => ({
        backgroundColor: theme.palette.background.paper,
      }),
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
    muiTableBodyRowProps: ({ row }) => {
      return {
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
    enableBottomToolbar: false,
  });

  if (error) {
    return (
      <PageContainer
        breadcrumbs={[{ title: 'Lista budów' }]}
        fixedHeight={true}
      >
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

  if (isSettingsLoading || isLoading) {
    return (
      <PageContainer
        fixedHeight={true}
        breadcrumbs={[{ title: 'Lista budów' }]}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Loading />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      renderBottomToolbar={<TablePagination table={table} />}
      fixedHeight={true}
      breadcrumbs={[{ title: 'Lista budów' }]}
      actions={[
        <Button
          key="contractors"
          variant="contained"
          onClick={handleOpenContractors}
          startIcon={<Engineering />}
          size="small"
        >
          Wykonawcy
        </Button>,
        <Button
          key="new"
          variant="contained"
          onClick={handleCreateClick}
          startIcon={<AddIcon />}
          size="small"
        >
          Nowa
        </Button>,
      ]}
    >
      <Box
        sx={{
          flex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <LocalizationProvider
          localeText={
            plPL.components.MuiLocalizationProvider.defaultProps.localeText
          }
          dateAdapter={AdapterDayjs}
          adapterLocale="pl"
        >
          <MaterialReactTable table={table} />
          <ContractorsDialog
            constructions={constructions}
            open={contractorsModalOpen}
            onClose={handleCloseContractors}
          />

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
      </Box>
    </PageContainer>
  );
}
