import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import 'dayjs/locale/pl';
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
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CloseIcon from '@mui/icons-material/Close';
import type { Dayjs } from 'dayjs';

export interface ConstructionsFilters {
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

export const FiltersDialog = ({
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