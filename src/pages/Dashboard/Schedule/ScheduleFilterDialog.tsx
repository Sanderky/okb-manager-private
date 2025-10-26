import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  TextField,
  Checkbox,
  Button,
  IconButton,
  Stack,
  Typography,
  Autocomplete,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
  return (
    <Dialog
      open={isFilterOpen}
      onClose={() => setIsFilterOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ px: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent={'space-between'}
        >
          <Typography variant="h6" component="div">
            Filtr pracowników
          </Typography>
          <IconButton onClick={() => setIsFilterOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          px: 2,
        }}
      >
        <FormControl sx={{ width: '100%', maxWidth: '100%' }}>
          <Autocomplete
            size="small"
            multiple
            id="checkboxes-tags-demo"
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
            renderInput={(params) => (
              <TextField {...params} label="Pracownicy" />
            )}
          />
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 2 }}>
        <Button onClick={() => setSelectedEmployees([])}>Wyczyść</Button>
      </DialogActions>
    </Dialog>
  );
};
