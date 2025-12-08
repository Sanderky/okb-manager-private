import React, { useState } from 'react';
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
import type { Construction, Employee } from '../../../types';
import { useQuery } from '@tanstack/react-query';
import { getEmployeeList } from '../../../services/employees';
import { getConstructionList } from '../../../services/constructions';
import 'dayjs/locale/pl';

const useEmployeesConstructionsFilter = (
  selectedConstructions: Construction[],
  selectedEmployees: Employee[],
  onSelectedConstructionsChange: (constructions: Construction[]) => void,
  onSelectedEmployeesChange: (employees: Employee[]) => void
) => {
  const [showInactiveEmployees, setShowInactiveEmployees] = useState(false);
  const [showInactiveConstructions, setShowInactiveConstructions] =
    useState(false);

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
  });

  const { data: constructions } = useQuery({
    queryKey: ['constructions'],
    queryFn: getConstructionList,
  });

  const filteredEmployees = showInactiveEmployees
    ? (employees ?? [])
    : (employees?.filter((e) => e.status) ?? []);
  const filteredConstructions = showInactiveConstructions
    ? (constructions ?? [])
    : (constructions?.filter((c) => c.status) ?? []);

  const handleSelectConstructions = (constructions: Construction[]) => {
    onSelectedConstructionsChange(constructions);
  };

  const handleSelectAllConstructions = () => {
    onSelectedConstructionsChange(filteredConstructions);
  };

  const handleDeselectAllConstructions = () => {
    onSelectedConstructionsChange([]);
  };

  const handleSelectEmployees = (employees: Employee[]) => {
    onSelectedEmployeesChange(employees);
  };

  const handleSelectAllEmployees = () => {
    onSelectedEmployeesChange(filteredEmployees);
  };

  const handleDeselectAllEmployees = () => {
    onSelectedEmployeesChange([]);
  };

  const handleShowInactiveEmployeesChange = (show: boolean) =>
    setShowInactiveEmployees(show);
  const handleShowInactiveConstructionsChange = (show: boolean) =>
    setShowInactiveConstructions(show);

  return {
    selectedConstructions,
    selectedEmployees,
    handleSelectEmployees,
    handleSelectConstructions,
    handleDeselectAllConstructions,
    handleDeselectAllEmployees,
    handleSelectAllConstructions,
    handleSelectAllEmployees,
    handleShowInactiveConstructionsChange,
    handleShowInactiveEmployeesChange,
    filteredConstructions,
    filteredEmployees,
    showInactiveConstructions,
    showInactiveEmployees,
  };
};

interface EmployeesContructionsFiltersInterface {
  selectedConstructions: Construction[];
  onSelectedConstructionsChange: (constructions: Construction[]) => void;
  selectedEmployees: Employee[];
  onSelectedEmployeesChange: (employees: Employee[]) => void;
}

const EmployeesContructionsFilters = ({
  selectedConstructions,
  selectedEmployees,
  onSelectedConstructionsChange,
  onSelectedEmployeesChange,
}: EmployeesContructionsFiltersInterface) => {
  const {
    filteredConstructions,
    filteredEmployees,
    handleDeselectAllConstructions,
    handleDeselectAllEmployees,
    handleSelectAllConstructions,
    handleSelectAllEmployees,
    handleSelectConstructions,
    handleSelectEmployees,
    handleShowInactiveConstructionsChange,
    handleShowInactiveEmployeesChange,
    showInactiveEmployees,
    showInactiveConstructions,
  } = useEmployeesConstructionsFilter(
    selectedConstructions,
    selectedEmployees,
    onSelectedConstructionsChange,
    onSelectedEmployeesChange
  );

  const handleChangeConstructionFilter = (
    _: React.SyntheticEvent<Element, Event>,
    newValue: Construction[]
  ) => {
    handleSelectConstructions(newValue);
  };

  const handleChangeEmployeeFilter = (
    _: React.SyntheticEvent<Element, Event>,
    newValue: Employee[]
  ) => {
    handleSelectEmployees(newValue);
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
          onChange={handleChangeConstructionFilter}
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
        label={<Typography variant="caption">Pokaż zakończone</Typography>}
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
          onChange={handleChangeEmployeeFilter}
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
        label={<Typography variant="caption">Pokaż nieaktywnych</Typography>}
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
