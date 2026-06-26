import { useMemo } from 'react';
import {
  Button,
  Typography,
  FormControl,
  Stack,
  Box,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  TextField,
  Chip,
  Divider,
} from '@mui/material';
import type { Construction } from '@/entities/construction';
import type { Employee } from '@/entities/employee';
import { useTranslation } from 'react-i18next';

interface EmployeesContructionsFiltersInterface {
  selectedConstructions: Construction[];
  onSelectedConstructionsChange: (constructions: Construction[]) => void;
  selectedEmployees: Employee[];
  onSelectedEmployeesChange: (employees: Employee[]) => void;
  showInactiveEmployees: boolean;
  showInactiveConstructions: boolean;
  employees: Employee[];
  constructions: Construction[];
  handleShowInactiveConstructionsChange: (val: boolean) => void;
  handleShowInactiveEmployeesChange: (val: boolean) => void;
}

const EmployeesContructionsFilters = ({
  selectedConstructions,
  selectedEmployees,
  onSelectedConstructionsChange,
  onSelectedEmployeesChange,
  showInactiveEmployees,
  showInactiveConstructions,
  employees,
  constructions,
  handleShowInactiveConstructionsChange,
  handleShowInactiveEmployeesChange,
}: EmployeesContructionsFiltersInterface) => {
  const filteredEmployees = useMemo(() => {
    if (showInactiveEmployees) return employees;
    return employees.filter((e) => e.status);
  }, [employees, showInactiveEmployees]);

  const filteredConstructions = useMemo(() => {
    let result = constructions;
    if (!showInactiveConstructions) {
      result = result.filter((c) => c.status);
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [constructions, showInactiveConstructions]);

  const handleSelectConstructions = (_: any, newValue: Construction[]) => {
    onSelectedConstructionsChange(newValue);
  };

  const handleSelectAllConstructions = () => {
    onSelectedConstructionsChange(filteredConstructions);
  };

  const handleDeselectAllConstructions = () => {
    onSelectedConstructionsChange([]);
  };

  const handleSelectEmployees = (_: any, newValue: Employee[]) => {
    onSelectedEmployeesChange(newValue);
  };

  const handleSelectAllEmployees = () => {
    onSelectedEmployeesChange(filteredEmployees);
  };

  const handleDeselectAllEmployees = () => {
    onSelectedEmployeesChange([]);
  };

  const { t } = useTranslation(['filters', 'constructions', 'employees']);

  const isAllEmployeesSelected =
    selectedEmployees.length === filteredEmployees.length &&
    filteredEmployees.length > 0;
  const isAllConstructionsSelected =
    selectedConstructions.length === filteredConstructions.length &&
    filteredConstructions.length > 0;

  return (
    <Box
      sx={{
        width: '100%',
      }}
    >
      <Typography sx={{ mb: 1 }} component={'div'} variant="subtitle2">
        {t('constructionsTitle')}
      </Typography>
      <Typography sx={{ mb: 1 }} component={'div'} variant="overline">
        {selectedConstructions.length > 0
          ? t('selectedCount', {
              selected: selectedConstructions.length,
              total: filteredConstructions.length,
            })
          : t('allConstructions')}
      </Typography>

      <FormControl sx={{ width: '100%', maxWidth: '100%' }}>
        <Autocomplete
          size="small"
          multiple
          options={filteredConstructions}
          disableCloseOnSelect
          getOptionLabel={(option) => option.name}
          value={selectedConstructions}
          onChange={handleSelectConstructions}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option, { selected }) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key} {...optionProps}>
                <Checkbox checked={selected} />
                {option.name}
                {!option.status && (
                  <Chip
                    label={t('constructions:inactive')}
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField {...params} label={t('constructionsLabel')} />
          )}
        />
      </FormControl>
      <FormControlLabel
        sx={{ mt: 1 }}
        control={
          <Checkbox
            size="small"
            checked={showInactiveConstructions}
            onChange={(e) =>
              handleShowInactiveConstructionsChange(e.target.checked)
            }
          />
        }
        label={
          <Typography variant="caption">
            {t('includeCompletedConstructions')}
          </Typography>
        }
      />
      <Stack direction="row" spacing={1} justifyContent={'flex-end'}>
        <Button
          onClick={handleSelectAllConstructions}
          disabled={isAllConstructionsSelected}
        >
          {t('selectAll')}
        </Button>
        <Button onClick={handleDeselectAllConstructions}>{t('clear')}</Button>
      </Stack>

      <Divider sx={{ mb: 2, mt: 2 }} />

      <Typography sx={{ mb: 1 }} component={'div'} variant="subtitle2">
        {t('employeesTitle')}
      </Typography>
      <Typography sx={{ mb: 1 }} component={'div'} variant="overline">
        {selectedEmployees.length > 0
          ? t('selectedCount', {
              selected: selectedEmployees.length,
              total: filteredEmployees.length,
            })
          : t('allEmployees')}
      </Typography>
      <FormControl sx={{ width: '100%', maxWidth: '100%' }}>
        <Autocomplete
          size="small"
          multiple
          options={filteredEmployees}
          disableCloseOnSelect
          getOptionLabel={(option) => option.name}
          value={selectedEmployees}
          onChange={handleSelectEmployees}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option, { selected }) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key} {...optionProps}>
                <Checkbox checked={selected} />
                {option.name}
                {!option.status && (
                  <Chip
                    label={t('employees:inactive')}
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField {...params} label={t('employeesLabel')} />
          )}
        />
      </FormControl>
      <FormControlLabel
        sx={{ mt: 1 }}
        control={
          <Checkbox
            size="small"
            checked={showInactiveEmployees}
            onChange={(e) =>
              handleShowInactiveEmployeesChange(e.target.checked)
            }
          />
        }
        label={
          <Typography variant="caption">
            {t('includeInactiveEmployees')}
          </Typography>
        }
      />
      <Stack direction="row" spacing={1} justifyContent={'flex-end'}>
        <Button
          onClick={handleSelectAllEmployees}
          disabled={isAllEmployeesSelected}
        >
          {t('selectAll')}
        </Button>
        <Button onClick={handleDeselectAllEmployees}>{t('clear')}</Button>
      </Stack>
    </Box>
  );
};

export default EmployeesContructionsFilters;
