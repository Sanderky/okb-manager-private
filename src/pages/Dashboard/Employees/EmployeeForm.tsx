import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormGroup from '@mui/material/FormGroup';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { type Dayjs } from 'dayjs';
import type { Employee } from '../../../types';
import Alert from '@mui/material/Alert';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import { Checkbox, FormControlLabel } from '@mui/material';

export interface EmployeeFormState {
  values: Partial<Omit<Employee, 'id'>>;
  errors: Partial<Record<keyof EmployeeFormState['values'], string>>;
}

export type FormFieldValue = string | string[] | number | boolean | File | null;

export interface EmployeeFormProps {
  formId?: string;
  formState: EmployeeFormState;
  onFieldChange: (
    name: keyof EmployeeFormState['values'],
    value: FormFieldValue
  ) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset?: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

type FieldType = 'text' | 'email' | 'date' | 'boolean';

interface EmployeeField {
  key: keyof EmployeeFormState['values'];
  label: string;
  type: FieldType;
}

export const validate = (
  values: Partial<Omit<Employee, 'id'>>
): Partial<Record<keyof EmployeeFormState['values'], string>> => {
  const errors: Partial<Record<keyof EmployeeFormState['values'], string>> = {};

  if (!values.name) {
    errors.name = 'Imię jest wymagane.';
  }

  if (!values.email) {
    errors.email = 'E-mail jest wymagany.';
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Nieprawidłowy format adresu e-mail.';
  }

  if (!values.phone) {
    errors.phone = 'Telefon jest wymagany.';
  }

  if (!values.hireDate) {
    errors.hireDate = 'Data zatrudnienia jest wymagana.';
  }

  if (
    values.hireDate &&
    values.contractEndDate &&
    dayjs(values.contractEndDate).isBefore(dayjs(values.hireDate))
  ) {
    errors.contractEndDate =
      'Data wygaśnięcia umowy nie może być wcześniejsza niż data zatrudnienia.';
  }

  return errors;
};

export default function EmployeeForm(props: EmployeeFormProps) {
  const {
    formId,
    formState,
    onFieldChange,
    onSubmit,
    onReset,
    isSubmitting,
    submitError,
  } = props;

  const formValues = formState.values;
  const formErrors = formState.errors;

  const handleFieldChange = React.useCallback(
    (
      name: keyof EmployeeFormState['values'],
      value: string | boolean | Dayjs | null
    ) => {
      if (dayjs.isDayjs(value)) {
        onFieldChange(name, value.isValid() ? value.toISOString() : null);
      } else {
        onFieldChange(name, value);
      }
    },
    [onFieldChange]
  );

  const employeeFields: EmployeeField[] = [
    { key: 'name', label: 'Imię i nazwisko', type: 'text' },
    { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'phone', label: 'Telefon', type: 'text' },
    { key: 'address', label: 'Adres', type: 'text' },
    { key: 'status', label: 'Zatrudniony', type: 'boolean' },
    { key: 'hireDate', label: 'Data zatrudnienia', type: 'date' },
    {
      key: 'contractEndDate',
      label: 'Data wygaśnięcia umowy',
      type: 'date',
    },
  ];

  return (
    <Box
      id={formId}
      component="form"
      onSubmit={onSubmit}
      noValidate
      autoComplete="off"
      onReset={onReset}
      sx={{ width: '100%' }}
    >
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}
      <FormGroup>
        <Grid container columnSpacing={3} rowSpacing={4}>
          {employeeFields.map(({ key, label, type }) => (
            <Grid sx={{ xs: 12, md: 6 }} key={key}>
              {type === 'date' ? (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label={label}
                    value={formValues[key] ? dayjs(formValues[key]) : null}
                    onChange={(newValue) => handleFieldChange(key, newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        name: key,
                        error: Boolean(formErrors[key]),
                        helperText: formErrors[key],
                      },
                    }}
                  />
                </LocalizationProvider>
              ) : type === 'boolean' ? (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(formValues[key])}
                      onChange={(e) => handleFieldChange(key, e.target.checked)}
                      name={key}
                    />
                  }
                  label={label}
                />
              ) : (
                <TextField
                  fullWidth
                  label={label}
                  type={type}
                  value={formValues[key] ?? ''}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  name={key}
                  error={Boolean(formErrors[key])}
                  helperText={formErrors[key]}
                />
              )}
            </Grid>
          ))}
        </Grid>
      </FormGroup>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        spacing={3}
        sx={{ mt: 4 }}
      >
        <Button
          variant="contained"
          startIcon={<DoneAllOutlinedIcon />}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
        </Button>
      </Stack>
    </Box>
  );
}
