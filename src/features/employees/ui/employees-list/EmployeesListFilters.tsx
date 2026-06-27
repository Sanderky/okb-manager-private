import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { Typography } from '@mui/material';
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
  FormLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import type { EmployeesFilters } from '../../model/types';

interface FiltersDialogProps {
  filtersModalOpen: boolean;
  handleCloseFilters: () => void;
  filters: EmployeesFilters;
  setFilters: (val: EmployeesFilters) => void;
  handleCloseAndReset: () => void;
  handleApplyFilters: () => void;
}

export const FiltersDialog = ({
  filtersModalOpen,
  handleCloseFilters,
  filters,
  setFilters,
  handleApplyFilters,
  handleCloseAndReset,
}: FiltersDialogProps) => {
  const { t } = useTranslation('employees');
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
          <Typography variant="h6">{t('list.filters.title')}</Typography>
          <IconButton onClick={handleCloseFilters}>
            <CloseIcon fontSize="inherit" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers className="p-3 sm:p-5">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormLabel className="mb-2 block">
              {t('form.fields.name')}
            </FormLabel>
            <TextField
              size="small"
              fullWidth
              value={filters.name ?? ''}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormLabel className="mb-2 block">
              {t('form.fields.email')}
            </FormLabel>
            <TextField
              size="small"
              fullWidth
              value={filters.email ?? ''}
              onChange={(e) =>
                setFilters({ ...filters, email: e.target.value })
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormLabel className="mb-2 block">
              {t('form.fields.phone')}
            </FormLabel>
            <TextField
              size="small"
              fullWidth
              value={filters.phone ?? ''}
              onChange={(e) =>
                setFilters({ ...filters, phone: e.target.value })
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormLabel className="mb-2 block">
              {t('form.fields.pesel')}
            </FormLabel>
            <TextField
              size="small"
              fullWidth
              value={filters.pesel ?? ''}
              onChange={(e) =>
                setFilters({ ...filters, pesel: e.target.value })
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormLabel className="mb-2 block">
              {t('form.fields.address')}
            </FormLabel>
            <TextField
              size="small"
              fullWidth
              value={filters.address ?? ''}
              onChange={(e) =>
                setFilters({ ...filters, address: e.target.value })
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <FormLabel className="mb-2 block">
                {t('list.filters.status')}
              </FormLabel>
              <Select
                size="small"
                value={filters.status ?? ''}
                displayEmpty
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <MenuItem value="">{t('list.filters.options.all')}</MenuItem>
                <MenuItem value="true">
                  {t('list.filters.options.active')}
                </MenuItem>
                <MenuItem value="false">
                  {t('list.filters.options.inactive')}
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <FormLabel className="mb-2 block">
                {t('form.sections.contractor')}
              </FormLabel>
              <Select
                size="small"
                value={filters.isContractor ?? ''}
                displayEmpty
                onChange={(e) =>
                  setFilters({ ...filters, isContractor: e.target.value })
                }
              >
                <MenuItem value="">{t('list.filters.options.all')}</MenuItem>
                <MenuItem value="true">
                  {t('list.filters.options.yes')}
                </MenuItem>
                <MenuItem value="false">
                  {t('list.filters.options.no')}
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormLabel className="mb-2 block">
              {t('list.filters.hourRate')}
            </FormLabel>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={'center'}
              spacing={1}
            >
              <TextField
                size="small"
                type="number"
                fullWidth
                value={filters.hourRateFrom ?? ''}
                label={t('list.filters.from')}
                onChange={(e) => {
                  setFilters({ ...filters, hourRateFrom: e.target.value });
                }}
              />
              <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>
                -
              </Typography>
              <TextField
                type="number"
                fullWidth
                value={filters.hourRateTo ?? ''}
                label={t('list.filters.to')}
                size="small"
                onChange={(e) =>
                  setFilters({ ...filters, hourRateTo: e.target.value })
                }
              />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormLabel className="mb-2 block">
              {t('form.fields.birthPlace')}
            </FormLabel>
            <TextField
              size="small"
              fullWidth
              value={filters.birthPlace ?? ''}
              onChange={(e) =>
                setFilters({ ...filters, birthPlace: e.target.value })
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormLabel className="mb-2 block">
              {t('form.fields.birthDate')}
            </FormLabel>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={'center'}
              spacing={1}
            >
              <DatePicker
                label={t('list.filters.from')}
                openTo="month"
                views={['year', 'month', 'day']}
                value={filters.birthDateFrom ?? null}
                onChange={(newValue) =>
                  setFilters({ ...filters, birthDateFrom: newValue })
                }
                slotProps={{
                  field: {
                    clearable: true,
                    onClear: () =>
                      setFilters({ ...filters, birthDateFrom: null }),
                  },
                  textField: { fullWidth: true, size: 'small' },
                }}
              />
              <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>
                -
              </Typography>
              <DatePicker
                openTo="month"
                views={['year', 'month', 'day']}
                label={t('list.filters.to')}
                value={filters.birthDateTo ?? null}
                onChange={(newValue) =>
                  setFilters({ ...filters, birthDateTo: newValue })
                }
                slotProps={{
                  field: {
                    clearable: true,
                    onClear: () =>
                      setFilters({ ...filters, birthDateTo: null }),
                  },
                  textField: { fullWidth: true, size: 'small' },
                }}
                minDate={filters.birthDateFrom || undefined}
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormLabel className="mb-2 block">
              {t('form.fields.contractStartDate')}
            </FormLabel>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={'center'}
              spacing={1}
            >
              <DatePicker
                label={t('list.filters.from')}
                openTo="month"
                views={['year', 'month', 'day']}
                value={filters.contractStartDateFrom ?? null}
                onChange={(newValue) =>
                  setFilters({ ...filters, contractStartDateFrom: newValue })
                }
                slotProps={{
                  field: {
                    clearable: true,
                    onClear: () =>
                      setFilters({ ...filters, contractStartDateFrom: null }),
                  },
                  textField: { fullWidth: true, size: 'small' },
                }}
              />
              <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>
                -
              </Typography>
              <DatePicker
                label={t('list.filters.to')}
                openTo="month"
                views={['year', 'month', 'day']}
                value={filters.contractStartDateTo ?? null}
                onChange={(newValue) =>
                  setFilters({ ...filters, contractStartDateTo: newValue })
                }
                slotProps={{
                  field: {
                    clearable: true,
                    onClear: () =>
                      setFilters({ ...filters, contractStartDateTo: null }),
                  },
                  textField: { fullWidth: true, size: 'small' },
                }}
                minDate={filters.contractStartDateFrom || undefined}
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormLabel className="mb-2 block">
              {t('form.fields.contractEndDate')}
            </FormLabel>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={'center'}
              spacing={1}
            >
              <DatePicker
                label={t('list.filters.from')}
                openTo="month"
                views={['year', 'month', 'day']}
                value={filters.contractEndDateFrom ?? null}
                onChange={(newValue) =>
                  setFilters({ ...filters, contractEndDateFrom: newValue })
                }
                slotProps={{
                  field: {
                    clearable: true,
                    onClear: () =>
                      setFilters({ ...filters, contractEndDateFrom: null }),
                  },
                  textField: { fullWidth: true, size: 'small' },
                }}
              />
              <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>
                -
              </Typography>
              <DatePicker
                label={t('list.filters.to')}
                openTo="month"
                views={['year', 'month', 'day']}
                value={filters.contractEndDateTo ?? null}
                onChange={(newValue) =>
                  setFilters({ ...filters, contractEndDateTo: newValue })
                }
                slotProps={{
                  field: {
                    clearable: true,
                    onClear: () =>
                      setFilters({ ...filters, contractEndDateTo: null }),
                  },
                  textField: { fullWidth: true, size: 'small' },
                }}
                minDate={filters.contractEndDateFrom || undefined}
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormLabel className="mb-2 block">
              {t('form.fields.a1StartDate')}
            </FormLabel>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={'center'}
              spacing={1}
            >
              <DatePicker
                label={t('list.filters.from')}
                openTo="month"
                views={['year', 'month', 'day']}
                value={filters.a1StartDateFrom ?? null}
                onChange={(newValue) =>
                  setFilters({ ...filters, a1StartDateFrom: newValue })
                }
                slotProps={{
                  field: {
                    clearable: true,
                    onClear: () =>
                      setFilters({ ...filters, a1StartDateFrom: null }),
                  },
                  textField: { fullWidth: true, size: 'small' },
                }}
              />
              <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>
                -
              </Typography>
              <DatePicker
                label={t('list.filters.to')}
                openTo="month"
                views={['year', 'month', 'day']}
                value={filters.a1StartDateTo ?? null}
                onChange={(newValue) =>
                  setFilters({ ...filters, a1StartDateTo: newValue })
                }
                slotProps={{
                  field: {
                    clearable: true,
                    onClear: () =>
                      setFilters({ ...filters, a1StartDateTo: null }),
                  },
                  textField: { fullWidth: true, size: 'small' },
                }}
                minDate={filters.a1StartDateFrom || undefined}
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormLabel className="mb-2 block">
              {t('form.fields.a1EndDate')}
            </FormLabel>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={'center'}
              spacing={1}
            >
              <DatePicker
                label={t('list.filters.from')}
                openTo="month"
                views={['year', 'month', 'day']}
                value={filters.a1EndDateFrom ?? null}
                onChange={(newValue) =>
                  setFilters({ ...filters, a1EndDateFrom: newValue })
                }
                slotProps={{
                  field: {
                    clearable: true,
                    onClear: () =>
                      setFilters({ ...filters, a1EndDateFrom: null }),
                  },
                  textField: { fullWidth: true, size: 'small' },
                }}
              />
              <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>
                -
              </Typography>
              <DatePicker
                label={t('list.filters.to')}
                openTo="month"
                views={['year', 'month', 'day']}
                value={filters.a1EndDateTo ?? null}
                onChange={(newValue) =>
                  setFilters({ ...filters, a1EndDateTo: newValue })
                }
                slotProps={{
                  field: {
                    clearable: true,
                    onClear: () =>
                      setFilters({ ...filters, a1EndDateTo: null }),
                  },
                  textField: { fullWidth: true, size: 'small' },
                }}
                minDate={filters.a1EndDateFrom || undefined}
              />
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className="p-3 sm:p-5">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent={'flex-end'}
          spacing={1}
          sx={{ width: '100%' }}
        >
          <Button
            onClick={handleCloseAndReset}
            variant="outlined"
            color="primary"
          >
            {t('list.filters.clear')}
          </Button>
          <Button onClick={handleApplyFilters} variant="contained">
            {t('list.filters.apply')}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};
