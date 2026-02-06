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
import type { Construction, Employee } from '../../../shared/model/types';
import 'dayjs/locale/pl';

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
        Filtr budów
      </Typography>
      <Typography sx={{ mb: 1 }} component={'div'} variant="overline">
        {selectedConstructions.length > 0
          ? `Wybrano: ${selectedConstructions.length} z ${filteredConstructions.length}`
          : 'Wszystkie budowy'}
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
                    label="Zakończona"
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </li>
            );
          }}
          renderInput={(params) => <TextField {...params} label="Budowy" />}
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
            Uwzględnij zakończone budowy w filtrze
          </Typography>
        }
      />
      <Stack direction="row" spacing={1} justifyContent={'flex-end'}>
        <Button
          onClick={handleSelectAllConstructions}
          disabled={isAllConstructionsSelected}
        >
          Wszystko
        </Button>
        <Button onClick={handleDeselectAllConstructions}>Wyczyść</Button>
      </Stack>

      <Divider sx={{ mb: 2, mt: 2 }} />

      <Typography sx={{ mb: 1 }} component={'div'} variant="subtitle2">
        Filtr pracowników
      </Typography>
      <Typography sx={{ mb: 1 }} component={'div'} variant="overline">
        {selectedEmployees.length > 0
          ? `Wybrano: ${selectedEmployees.length} z ${filteredEmployees.length}`
          : 'Wszyscy pracownicy'}
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
                    label="Nieaktywny"
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </li>
            );
          }}
          renderInput={(params) => <TextField {...params} label="Pracownicy" />}
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
            Uwzględnij nieaktywnych pracowników w filtrze
          </Typography>
        }
      />
      <Stack direction="row" spacing={1} justifyContent={'flex-end'}>
        <Button
          onClick={handleSelectAllEmployees}
          disabled={isAllEmployeesSelected}
        >
          Wszystko
        </Button>
        <Button onClick={handleDeselectAllEmployees}>Wyczyść</Button>
      </Stack>
    </Box>
  );
};

export default EmployeesContructionsFilters;
