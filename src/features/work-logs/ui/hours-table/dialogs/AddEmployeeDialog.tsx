import React, { useState } from 'react';
import {
  Button,
  FormControl,
  Stack,
  Checkbox,
  Autocomplete,
  TextField,
  Chip,
} from '@mui/material';
import 'dayjs/locale/pl';
import BaseDialog from '@/shared/ui/BaseDialog';
import { createEmptyWorkHours } from '../../../model/utils/hoursTableUtils';
import type { Construction } from '@/entities/construction';
import type { Employee } from '@/entities/employee';
import type { WorkHours } from '../../../model/types';

interface AddEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  selectedConstruction: Construction | null;
  currentWeek: Date;
  onEmployeeAdded: (newWorkHours: WorkHours[]) => void;
  availableEmployees: Employee[];
}

export const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({
  open,
  onClose,
  selectedConstruction,
  currentWeek,
  onEmployeeAdded,
  availableEmployees,
}) => {
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);

  const handleAdd = () => {
    if (selectedEmployees.length === 0 || !selectedConstruction) return;
    onEmployeeAdded(
      createEmptyWorkHours(
        selectedConstruction.id,
        selectedEmployees,
        currentWeek
      )
    );
    setSelectedEmployees([]);
    onClose();
  };

  const isAllSelected = selectedEmployees.length === availableEmployees.length;

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={`Dodaj pracowników do budowy: ${selectedConstruction?.name}`}
      showConfirm={false}
      actions={
        <Stack direction="row" spacing={1}>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={selectedEmployees.length === 0}
          >
            Dodaj ({selectedEmployees.length})
          </Button>
        </Stack>
      }
    >
      <FormControl fullWidth sx={{ mt: 2 }}>
        <Autocomplete
          size="small"
          multiple
          disableCloseOnSelect
          options={availableEmployees}
          getOptionLabel={(option) => option.name}
          value={selectedEmployees}
          onChange={(_, newValue) => setSelectedEmployees(newValue)}
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
                    variant="outlined"
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Wybierz pracowników"
              placeholder={
                selectedEmployees.length === 0 ? 'Wybierz pracowników...' : ''
              }
            />
          )}
          noOptionsText={
            availableEmployees.length === 0
              ? 'Wszyscy pracownicy są już dodani do tej budowy'
              : 'Brak dostępnych opcji'
          }
        />
      </FormControl>
      <Stack direction="row" mt={1} spacing={1} justifyContent={'flex-end'}>
        <Button
          onClick={() => setSelectedEmployees(availableEmployees)}
          disabled={isAllSelected}
        >
          Wszystko
        </Button>
        <Button onClick={() => setSelectedEmployees([])}>Wyczyść</Button>
      </Stack>
    </BaseDialog>
  );
};
