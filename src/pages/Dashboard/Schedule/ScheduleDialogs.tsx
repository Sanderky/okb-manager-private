import React from 'react';
import {
  FormControl,
  TextField,
  Checkbox,
  Button,
  Autocomplete,
  Typography,
  Stack,
} from '@mui/material';
import BaseDialog from '../../../components/BaseDialog';
import type { Employee } from '../../../types';

interface FilterDialogProps {
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  employees: Employee[];
  selectedEmployees: Employee[];
  setSelectedEmployees: (employees: Employee[]) => void;
}

export const FilterDialog: React.FC<FilterDialogProps> = ({
  isFilterOpen,
  setIsFilterOpen,
  employees,
  selectedEmployees,
  setSelectedEmployees,
}) => {
  const handleSelectAll = () => {
    setSelectedEmployees([...employees]);
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
      actions={
        <Stack direction="row" spacing={1}>
          <Button onClick={handleSelectAll} disabled={isAllSelected}>
            Wszystko
          </Button>
          <Button onClick={handleClear}>Wyczyść</Button>
        </Stack>
      }
    >
      <Typography variant="overline" sx={{ mb: 1.5, display: 'block' }}>
        {`Wybrane: ${selectedEmployees.length} z ${employees.length}`}
      </Typography>
      <FormControl sx={{ width: '100%', maxWidth: '100%' }}>
        <Autocomplete
          size="small"
          multiple
          options={employees}
          disableCloseOnSelect
          getOptionLabel={(opt) => opt.name}
          value={selectedEmployees}
          onChange={(_, newValue) => setSelectedEmployees(newValue)}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          renderOption={(props, option, { selected }) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key} {...optionProps}>
                <Checkbox checked={selected} />
                {option.name}
              </li>
            );
          }}
          renderInput={(params) => <TextField {...params} label="Pracownicy" />}
        />
      </FormControl>
    </BaseDialog>
  );
};
