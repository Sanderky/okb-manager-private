import React, { useMemo } from 'react';
import {
  FormControl,
  TextField,
  Checkbox,
  Stack,
  Typography,
  Autocomplete,
  Chip,
  Button,
  FormControlLabel,
} from '@mui/material';
import BaseDialog from '@/shared/ui/BaseDialog';
import type { Employee } from '@/entities/employee';

interface FilterDialogProps {
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  employees: Employee[];
  selectedEmployees: string[];
  setSelectedEmployees: (employees: string[]) => void;
  showInactive: boolean;
  setShowInactive: (val: boolean) => void;
}

export const FilterDialog: React.FC<FilterDialogProps> = ({
  isFilterOpen,
  setIsFilterOpen,
  employees,
  selectedEmployees,
  setSelectedEmployees,
  showInactive,
  setShowInactive,
}) => {
  const filteredEmployees = useMemo(() => {
    if (showInactive) {
      return employees;
    }
    return employees.filter((emp) => emp.status);
  }, [employees, showInactive]);

  const selectedEmployeeObjects = useMemo(() => {
    return employees.filter((e) => selectedEmployees.includes(e.id));
  }, [employees, selectedEmployees]);

  const handleSelectAll = () => {
    const allIds = filteredEmployees.map((e) => e.id);
    setSelectedEmployees(allIds);
  };

  const handleClear = () => {
    setSelectedEmployees([]);
  };

  const isAllSelected =
    selectedEmployees.length === employees.length && employees.length > 0;

  return (
    <BaseDialog
      open={isFilterOpen}
      onClose={() => setIsFilterOpen(false)}
      title="Filtr pracowników"
      showConfirm={false}
    >
      <Typography variant="overline" sx={{ mb: 1, display: 'block' }}>
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
          getOptionLabel={(opt) => opt.name}
          value={selectedEmployeeObjects}
          onChange={(_, newValue) =>
            setSelectedEmployees(newValue.map((e) => e.id))
          }
          isOptionEqualToValue={(option, value) => option.id === value?.id}
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
        control={
          <Checkbox
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            size="small"
          />
        }
        label={
          <Typography variant="caption">
            Uwzględnij nieaktywnych pracowników w filtrze
          </Typography>
        }
        sx={{ mt: 1 }}
      />
      <Stack direction="row" spacing={1} justifyContent={'flex-end'}>
        <Button onClick={handleSelectAll} disabled={isAllSelected}>
          Wszyscy
        </Button>
        <Button onClick={handleClear}>Wyczyść</Button>
      </Stack>
    </BaseDialog>
  );
};
