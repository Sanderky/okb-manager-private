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

interface AddConstructionWithEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  currentWeek: Date;
  onSuccess: (newWorkHours: WorkHours[]) => void;
  availableConstructions: Construction[];
  activeEmployees: Employee[];
}

export const AddConstructionWithEmployeeDialog: React.FC<
  AddConstructionWithEmployeeDialogProps
> = ({
  open,
  onClose,
  currentWeek,
  onSuccess,
  availableConstructions,
  activeEmployees: employees,
}) => {
  const [selectedConstruction, setSelectedConstruction] = useState<string>('');
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);

  const handleAdd = () => {
    if (!selectedConstruction || selectedEmployees.length === 0) return;
    onSuccess(
      createEmptyWorkHours(selectedConstruction, selectedEmployees, currentWeek)
    );
    setSelectedConstruction('');
    setSelectedEmployees([]);
    onClose();
  };

  const isAllSelected = selectedEmployees.length === employees.length;

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Dodaj nową budowę z pracownikami"
      showConfirm={false}
      actions={
        <Stack direction="row" spacing={1}>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={
              !selectedConstruction ||
              selectedEmployees.length === 0 ||
              availableConstructions.length === 0
            }
          >
            Dodaj ({selectedEmployees.length})
          </Button>
        </Stack>
      }
    >
      <FormControl fullWidth sx={{ mt: 2 }}>
        <Autocomplete
          size="small"
          value={
            availableConstructions.find((c) => c.id === selectedConstruction) ||
            null
          }
          onChange={(_, newValue) =>
            setSelectedConstruction(newValue?.id || '')
          }
          options={availableConstructions}
          getOptionLabel={(option) => option.name}
          renderInput={(params) => (
            <TextField {...params} label="Wybierz budowę" />
          )}
          noOptionsText={
            availableConstructions.length === 0
              ? 'Wszystkie budowy są już dodane do tabeli'
              : 'Brak dostępnych opcji'
          }
        />
      </FormControl>

      <FormControl fullWidth sx={{ mt: 2 }}>
        <Autocomplete
          size="small"
          multiple
          disableCloseOnSelect
          options={employees || []}
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
          noOptionsText="Brak dostępnych pracowników"
        />
      </FormControl>
      <Stack direction="row" mt={1} spacing={1} justifyContent={'flex-end'}>
        <Button
          onClick={() => setSelectedEmployees(employees || [])}
          disabled={isAllSelected}
        >
          Wszystko
        </Button>
        <Button onClick={() => setSelectedEmployees([])}>Wyczyść</Button>
      </Stack>
    </BaseDialog>
  );
};
