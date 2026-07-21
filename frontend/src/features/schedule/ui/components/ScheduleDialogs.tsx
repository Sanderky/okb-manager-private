import React, { useMemo } from 'react';
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
  Divider,
  Box,
} from '@mui/material';
import BaseDialog from '@/shared/ui/BaseDialog';
import { useTranslation } from 'react-i18next';
import type { Employee } from '@/entities/employee';
import type { Construction } from '@/entities/construction';

interface FilterDialogProps {
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;

  employees: Employee[];
  selectedEmployees: string[];
  setSelectedEmployees: (employees: string[]) => void;
  showInactive: boolean;
  setShowInactive: (show: boolean) => void;

  constructions: Construction[];
  selectedConstructions: string[];
  setSelectedConstructions: (constructions: string[]) => void;
  showInactiveConstructions: boolean;
  setShowInactiveConstructions: (show: boolean) => void;
}

export const FilterDialog: React.FC<FilterDialogProps> = ({
  isFilterOpen,
  setIsFilterOpen,
  employees,
  selectedEmployees,
  setSelectedEmployees,
  showInactive,
  setShowInactive,
  constructions,
  selectedConstructions,
  setSelectedConstructions,
  showInactiveConstructions,
  setShowInactiveConstructions,
}) => {
  const { t } = useTranslation(['schedule', 'common']);

  const filteredEmployees = useMemo(() => {
    if (showInactive) return employees;
    return employees.filter((emp) => emp.status);
  }, [employees, showInactive]);

  const selectedEmployeeObjects = useMemo(() => {
    return employees.filter((emp) => selectedEmployees.includes(emp.id));
  }, [employees, selectedEmployees]);

  const filteredConstructions = useMemo(() => {
    let result = constructions;
    if (!showInactiveConstructions) {
      result = result.filter((c) => c.status);
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [constructions, showInactiveConstructions]);

  const selectedConstructionObjects = useMemo(() => {
    return constructions.filter((c) => selectedConstructions.includes(c.id));
  }, [constructions, selectedConstructions]);

  const handleSelectAllEmployees = () => {
    const allIds = filteredEmployees.map((emp) => emp.id);
    setSelectedEmployees(allIds);
  };

  const handleClearEmployees = () => {
    setSelectedEmployees([]);
  };

  const handleClearConstructions = () => {
    setSelectedConstructions([]);
  };

  const handleSelectAllConstructions = () => {
    const allIds = filteredConstructions.map((emp) => emp.id);
    setSelectedConstructions(allIds);
  };

  const isAllEmployeesSelected =
    selectedEmployees.length === filteredEmployees.length &&
    filteredEmployees.length > 0;
  const isAllConstructionsSelected =
    selectedConstructions.length === filteredConstructions.length &&
    filteredConstructions.length > 0;

  return (
    <BaseDialog
      open={isFilterOpen}
      onClose={() => setIsFilterOpen(false)}
      title={t('schedule:filters.title')}
      showConfirm={false}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('schedule:filters.constructionsFilter')}
        </Typography>
        <Typography variant="overline" sx={{ mb: 1, display: 'block' }}>
          {selectedConstructions.length > 0
            ? t('schedule:filters.selectedCount', {
                selected: selectedConstructions.length,
                total: filteredConstructions.length,
              })
            : t('schedule:filters.allConstructions')}
        </Typography>

        <FormControl sx={{ width: '100%', maxWidth: '100%' }}>
          <Autocomplete
            size="small"
            multiple
            options={filteredConstructions}
            disableCloseOnSelect
            getOptionLabel={(opt) => opt.name}
            value={selectedConstructionObjects}
            onChange={(_, newValue) => {
              const newIds = newValue.map((c) => c.id);
              setSelectedConstructions(newIds);
            }}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            renderOption={(props, option, { selected }) => {
              const { key, ...optionProps } = props;
              return (
                <li key={key} {...optionProps}>
                  <Checkbox checked={selected} />
                  {option.name}
                  {!option.status && (
                    <Chip
                      label={t('schedule:filters.completed')}
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
              <TextField
                {...params}
                label={t('schedule:filters.selectConstructions')}
              />
            )}
          />
        </FormControl>

        <FormControlLabel
          sx={{ mt: 1 }}
          control={
            <Checkbox
              checked={showInactiveConstructions}
              onChange={(e) => setShowInactiveConstructions(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="caption">
              {t('schedule:filters.includeCompletedConstructions')}
            </Typography>
          }
        />
        <Stack direction="row" spacing={1} justifyContent={'flex-end'}>
          <Button
            onClick={handleSelectAllConstructions}
            disabled={isAllConstructionsSelected}
          >
            {t('common:buttons.all')}
          </Button>
          <Button onClick={handleClearConstructions}>
            {t('common:buttons.clear')}
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('schedule:filters.employeesFilter')}
        </Typography>
        <Typography variant="overline" sx={{ mb: 1, display: 'block' }}>
          {selectedEmployees.length > 0
            ? t('schedule:filters.selectedCount', {
                selected: selectedEmployees.length,
                total: filteredEmployees.length,
              })
            : t('schedule:filters.allEmployees')}
        </Typography>
        <FormControl sx={{ width: '100%', maxWidth: '100%' }}>
          <Autocomplete
            size="small"
            multiple
            options={filteredEmployees}
            disableCloseOnSelect
            getOptionLabel={(opt) => opt.name}
            value={selectedEmployeeObjects}
            onChange={(_, newValue) => {
              const newIds = newValue.map((emp) => emp.id);
              setSelectedEmployees(newIds);
            }}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            renderOption={(props, option, { selected }) => {
              const { key, ...optionProps } = props;
              return (
                <li key={key} {...optionProps}>
                  <Checkbox checked={selected} />
                  {option.name}
                  {!option.status && (
                    <Chip
                      label={t('common:status.inactive')}
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
              <TextField
                {...params}
                label={t('schedule:filters.selectEmployees')}
              />
            )}
          />
        </FormControl>

        <FormControlLabel
          sx={{ mt: 1 }}
          control={
            <Checkbox
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="caption">
              {t('schedule:filters.includeInactiveEmployees')}
            </Typography>
          }
        />

        <Stack direction="row" justifyContent={'flex-end'} spacing={1}>
          <Button
            onClick={handleSelectAllEmployees}
            disabled={isAllEmployeesSelected}
          >
            {t('common:buttons.all')}
          </Button>
          <Button onClick={handleClearEmployees}>
            {t('common:buttons.clear')}
          </Button>
        </Stack>
      </Box>
    </BaseDialog>
  );
};
