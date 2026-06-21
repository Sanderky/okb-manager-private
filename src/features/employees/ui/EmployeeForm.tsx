import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormGroup,
  Grid,
  Stack,
  TextField,
  Checkbox,
  Divider,
  FormControlLabel,
  InputAdornment,
  Switch,
  Typography,
  Alert,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { CheckCircleOutline } from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs from 'dayjs';
import { plPL } from '@mui/x-date-pickers/locales';
import { NoteBase } from '@/shared/ui/Note';
import type { EmployeeFormState, FormFieldValue } from '../model/types';

type FieldType = 'text' | 'email' | 'date' | 'boolean' | 'string' | 'number';

interface EmployeeField {
  key: keyof EmployeeFormState['values'];
  label: string;
  type: FieldType;
  required: boolean;
}

const EMPLOYEE_FIELDS: EmployeeField[] = [
  { key: 'name', label: 'Imię i nazwisko', type: 'text', required: true },
  { key: 'pesel', label: 'Pesel', type: 'string', required: false },
  { key: 'address', label: 'Adres', type: 'text', required: false },
  { key: 'email', label: 'E-mail', type: 'email', required: false },
  { key: 'phone', label: 'Telefon', type: 'text', required: false },
  { key: 'birthDate', label: 'Data urodzenia', type: 'date', required: false },
  {
    key: 'birthPlace',
    label: 'Miejsce urodzenia',
    type: 'text',
    required: false,
  },
  {
    key: 'hourRate',
    label: 'Stawka godzinowa',
    type: 'number',
    required: false,
  },
  {
    key: 'accountNumber',
    label: 'Numer konta',
    type: 'string',
    required: false,
  },
];

const CONTRACT_FIELDS: EmployeeField[] = [
  {
    key: 'contractStartDate',
    label: 'Data rozpoczęcia umowy',
    type: 'date',
    required: false,
  },
  {
    key: 'contractEndDate',
    label: 'Data wygaśnięcia umowy',
    type: 'date',
    required: false,
  },
];

const A1_FIELDS: EmployeeField[] = [
  {
    key: 'a1StartDate',
    label: 'Data rozpoczęcia A1',
    type: 'date',
    required: false,
  },
  {
    key: 'a1EndDate',
    label: 'Data wygaśnięcia A1',
    type: 'date',
    required: false,
  },
];

export interface EmployeeFormProps {
  formId?: string;
  formState: EmployeeFormState;
  onFieldChange: (
    name: keyof EmployeeFormState['values'],
    value: FormFieldValue
  ) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEditForm?: boolean;
  registerFieldRef?: (name: string, el: HTMLInputElement | null) => void;
}

export function EmployeeForm(props: EmployeeFormProps) {
  const {
    formId,
    formState,
    onFieldChange,
    onSubmit,
    onCancel,
    isSubmitting,
    isEditForm,
    registerFieldRef,
  } = props;

  const formValues = formState.values;
  const formErrors = formState.errors;

  const [cleared, setCleared] = useState<boolean>(false);

  useEffect(() => {
    if (cleared) {
      const timeout = setTimeout(() => setCleared(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [cleared]);

  const handleCustomFieldChange = React.useCallback(
    (
      name: keyof EmployeeFormState['values'],
      value: FormFieldValue | object | null
    ) => {
      if (dayjs.isDayjs(value))
        onFieldChange(name, value.toDate() as FormFieldValue);
      else onFieldChange(name, value as FormFieldValue);
    },
    [onFieldChange]
  );

  const renderField = ({ key, label, type, required }: EmployeeField) => {
    if (type === 'boolean') {
      return (
        <Grid size={{ xs: 12 }} key={key}>
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(formValues[key])}
                onChange={(e) => handleCustomFieldChange(key, e.target.checked)}
                name={key as string}
              />
            }
            label={label}
            required={required}
            inputRef={(el) => registerFieldRef?.(key as string, el)}
          />
        </Grid>
      );
    }

    if (type === 'date') {
      const val =
        formValues[key] instanceof Date ? dayjs(formValues[key] as Date) : null;
      return (
        <Grid size={{ xs: 12, md: 6 }} key={key}>
          <LocalizationProvider
            localeText={
              plPL.components.MuiLocalizationProvider.defaultProps.localeText
            }
            dateAdapter={AdapterDayjs}
            adapterLocale="pl"
          >
            <DatePicker
              label={label}
              value={val}
              openTo="month"
              views={['year', 'month', 'day']}
              onChange={(newValue) => handleCustomFieldChange(key, newValue)}
              disabled={
                (formValues.contractIsPermanent && key === 'contractEndDate') ??
                false
              }
              inputRef={(el) => registerFieldRef?.(key as string, el)}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  name: key as string,
                  required,
                  error: Boolean(formErrors[key]),
                  helperText: formErrors[key],
                },
                field: { clearable: true, onClear: () => setCleared(true) },
              }}
            />
          </LocalizationProvider>
        </Grid>
      );
    }

    if (key === 'hourRate') {
      return (
        <Grid size={{ xs: 12, md: 6 }} key={key}>
          <TextField
            type="text"
            label="Stawka godzinowa"
            fullWidth
            size="small"
            required={required}
            value={formValues[key] ?? ''}
            name={key as string}
            error={Boolean(formErrors[key])}
            helperText={formErrors[key]}
            inputRef={(el) => registerFieldRef?.(key as string, el)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">€</InputAdornment>
                ),
              },
            }}
            onChange={(e) => {
              const val = e.target.value.replace(/,/g, '.');
              if (val === '' || /^\d*(?:\.\d*)?$/.test(val))
                handleCustomFieldChange(key, val === '' ? null : val);
            }}
          />
        </Grid>
      );
    }

    return (
      <Grid size={{ xs: 12, md: 6 }} key={key}>
        <TextField
          size="small"
          fullWidth
          label={label}
          type={type}
          required={required}
          value={formValues[key] ?? ''}
          name={key as string}
          error={Boolean(formErrors[key])}
          helperText={formErrors[key]}
          inputRef={(el) => registerFieldRef?.(key as string, el)}
          onChange={(e) => {
            let value: FormFieldValue = e.target.value;
            if (type === 'number')
              value = e.target.value === '' ? null : Number(e.target.value);
            handleCustomFieldChange(key, value);
          }}
        />
      </Grid>
    );
  };

  return (
    <Box
      id={formId}
      component="form"
      onSubmit={onSubmit}
      noValidate
      autoComplete="off"
      sx={{ width: '100%' }}
    >
      <FormGroup>
        <Grid container columns={12} spacing={2.5} sx={{ maxWidth: '100%' }}>
          <Grid size={12}>
            <Alert severity="info" className="mb-3 px-3 py-0 font-medium">
              Pola oznaczone * są obowiązkowe.
            </Alert>
            <Typography variant="subtitle1" className="mb-3 font-medium">
              Dane pracownika
            </Typography>
            <Grid container columns={12} spacing={2}>
              {EMPLOYEE_FIELDS.map(renderField)}
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(formValues.isContractor)}
                      onChange={(e) =>
                        handleCustomFieldChange(
                          'isContractor',
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Kontraktor"
                />
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: '100%' }} />

          <Grid size={12}>
            <Typography variant="subtitle1" className="mb-3 font-medium">
              Umowa zatrudnienia
            </Typography>
            <Grid container columns={12} spacing={2}>
              {CONTRACT_FIELDS.map(renderField)}
              <Grid size={{ xs: 12 }} mt={-1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formValues.contractIsPermanent ?? false}
                      onChange={(e) => {
                        handleCustomFieldChange(
                          'contractIsPermanent',
                          e.target.checked
                        );
                        if (e.target.checked)
                          handleCustomFieldChange('contractEndDate', null);
                      }}
                    />
                  }
                  label="Na czas nieokreślony"
                />
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: '100%' }} />

          <Grid size={12}>
            <Typography variant="subtitle1" className="mb-3 font-medium">
              A1
            </Typography>
            <Grid container columns={12} spacing={2}>
              {A1_FIELDS.map(renderField)}
            </Grid>
          </Grid>

          {!isEditForm && (
            <React.Fragment>
              <Divider sx={{ width: '100%' }} />
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" className="mb-3 font-medium">
                  Notatka
                </Typography>
                <NoteBase
                  content={formValues.note ?? ''}
                  onChange={(note) => handleCustomFieldChange('note', note)}
                  editable={true}
                />
              </Grid>
            </React.Fragment>
          )}

          <Divider sx={{ width: '100%' }} />
        </Grid>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-start"
          spacing={3}
          sx={{ mt: 2 }}
        >
          <Button
            variant="contained"
            startIcon={<CheckCircleOutline />}
            type="submit"
            disabled={isSubmitting}
          >
            Zapisz
          </Button>
          {isSubmitting && <Typography>Zapisywanie danych...</Typography>}
          <Button
            variant="outlined"
            onClick={onCancel}
            startIcon={<ArrowBackIcon />}
            type="button"
            color="inherit"
            disabled={isSubmitting}
          >
            Anuluj
          </Button>
        </Stack>
      </FormGroup>
    </Box>
  );
}
