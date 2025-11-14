import React, { useMemo, useState } from 'react';
import {
  FormControl,
  TextField,
  Checkbox,
  Button,
  Autocomplete,
  Typography,
  Stack,
  Chip,
  FormControlLabel,
} from '@mui/material';
import BaseDialog from '../../../components/BaseDialog';
import type { Employee } from '../../../types';

interface FilterDialogProps {
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  filteredEmployees: Employee[];
  selectedEmployees: Employee[];
  setSelectedEmployees: (employees: Employee[]) => void;
  showInactive: boolean;
  setShowInactive: (show: boolean) => void;
}

export const FilterDialog: React.FC<FilterDialogProps> = ({
  isFilterOpen,
  setIsFilterOpen,
  filteredEmployees,
  selectedEmployees,
  setSelectedEmployees,
  showInactive,
  setShowInactive,
}) => {
  // const [showInactive, setShowInactive] = useState<boolean>(false);

  // const filteredEmployees = useMemo(() => {
  //   if (showInactive) {
  //     return employees;
  //   }
  //   return employees.filter((emp) => emp.status);
  // }, [employees, showInactive]);

  const handleSelectAll = () => {
    setSelectedEmployees([...filteredEmployees]);
  };

  const handleClear = () => {
    setSelectedEmployees([]);
  };

  const isAllSelected =
    selectedEmployees.length === filteredEmployees.length &&
    filteredEmployees.length > 0;

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
        {`Wybrane: ${selectedEmployees.length} z ${filteredEmployees.length}`}
      </Typography>
      <FormControl sx={{ width: '100%', maxWidth: '100%' }}>
        <Autocomplete
          size="small"
          multiple
          options={filteredEmployees}
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
        label="Pokaż nieaktywnych"
        className="mt-2"
      />
    </BaseDialog>
  );
};
