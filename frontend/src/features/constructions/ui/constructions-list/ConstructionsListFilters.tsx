import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';
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
import type { ConstructionsFilters } from '../../model/types';

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
  const { t } = useTranslation('constructions');

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
          <Typography variant="h6">{t('table.filtersTitle')}</Typography>
          <IconButton onClick={handleCloseFilters}>
            <CloseIcon fontSize="inherit" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers className="p-3 sm:p-5">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormLabel className="mb-2 block">{t('fields.name')}</FormLabel>
            <TextField
              size="small"
              fullWidth
              value={filters.name ?? ''}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormLabel className="mb-2 block">
              {t('fields.contractor')}
            </FormLabel>
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
            <FormLabel className="mb-2 block">{t('fields.address')}</FormLabel>
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
            <FormLabel className="mb-2 block">
              {t('fields.startDate')}
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
                label={t('fields.dateFrom')}
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
                label={t('fields.dateTo')}
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
            <FormLabel className="mb-2 block">{t('fields.endDate')}</FormLabel>
            <Stack
              direction={{
                xs: 'column',
                sm: 'row',
              }}
              alignItems={'center'}
              spacing={1}
            >
              <DatePicker
                label={t('fields.dateFrom')}
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
                label={t('fields.dateTo')}
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
            <FormLabel className="mb-2 block">
              {t('fields.employeeCount')}
            </FormLabel>
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
                label={t('fields.employeeCountMin')}
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
                label={t('fields.employeeCountMax')}
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <FormLabel className="mb-2 block">{t('fields.status')}</FormLabel>
              <Select
                size="small"
                value={filters.status ?? ''}
                displayEmpty
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <MenuItem value="">{t('statusOptions.all')}</MenuItem>
                <MenuItem value="true">
                  {t('statusOptions.inProgress')}
                </MenuItem>
                <MenuItem value="false">
                  {t('statusOptions.completed')}
                </MenuItem>
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
            {t('actions.clearFilters')}
          </Button>
          <Button onClick={handleApplyFilters} variant="contained">
            {t('actions.applyFilters')}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};
