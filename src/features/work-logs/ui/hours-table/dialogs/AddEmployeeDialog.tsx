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
import BaseDialog from '@/shared/ui/BaseDialog';
import { createEmptyWorkHours } from '../../../model/utils/hoursTableUtils';
import type { Construction } from '@/entities/construction';
import type { Employee } from '@/entities/employee';
import type { WorkHours } from '../../../model/types';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation([
    'workLogs',
    'constructions',
    'employees',
    'common',
  ]);
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
      title={t('workLogs:dialogs.addEmployee.title', {
        constructionName: selectedConstruction?.name,
      })}
      showConfirm={false}
      actions={
        <Stack direction="row" spacing={1}>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={selectedEmployees.length === 0}
          >
            {t('common:buttons.add')} ({selectedEmployees.length})
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
                    label={t('employees:inactive')}
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
              label={t('workLogs:dialogs.addEmployee.selectEmployees')}
            />
          )}
          noOptionsText={
            availableEmployees.length === 0
              ? t('workLogs:dialogs.addEmployee.noEmployeesAvailable')
              : t('workLogs:dialogs.addEmployee.noOptionsAvailable')
          }
        />
      </FormControl>
      <Stack direction="row" mt={1} spacing={1} justifyContent={'flex-end'}>
        <Button
          onClick={() => setSelectedEmployees(availableEmployees)}
          disabled={isAllSelected}
        >
          {t('common:buttons.all')}
        </Button>
        <Button onClick={() => setSelectedEmployees([])}>
          {t('common:buttons.clear')}
        </Button>
      </Stack>
    </BaseDialog>
  );
};
