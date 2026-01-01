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
import dayjs from 'dayjs';
import type { Employee } from '../../../types';
import Alert from '@mui/material/Alert';
import {
  Checkbox,
  Divider,
  FormControlLabel,
  InputAdornment,
  Switch,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { CheckCircleOutline } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { NoteBase } from '../../../components/Note';
import { plPL } from '@mui/x-date-pickers/locales';

export interface EmployeeFormState {
  values: Partial<Omit<Employee, 'id'>>;
  errors: Partial<Record<keyof EmployeeFormState['values'], string>>;
}

export type DateWithPermanent = { date: string | null; permanent: boolean };

export type FormFieldValue =
  | string
  | Date
  | boolean
  | null
  | DateWithPermanent
  | number;

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
  isEditForm?: boolean;
  registerFieldRef?: (name: string, el: HTMLInputElement | null) => void;
}

type FieldType = 'text' | 'email' | 'date' | 'boolean' | 'string' | 'number';

interface EmployeeField {
  key: keyof EmployeeFormState['values'];
  label: string;
  type: FieldType;
  required: boolean;
}

export default function EmployeeForm(props: EmployeeFormProps) {
  const {
    formId,
    formState,
    onFieldChange,
    onSubmit,
    onReset,
    isSubmitting,
    isEditForm,
  } = props;

  const formValues = formState.values;
  const formErrors = formState.errors;

  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();

  const handleFieldChange = React.useCallback(
    (
      name: keyof EmployeeFormState['values'],
      value: FormFieldValue | object | null
    ) => {
      if (dayjs.isDayjs(value)) {
        onFieldChange(name, value.toDate() as FormFieldValue);
      } else {
        onFieldChange(name, value as FormFieldValue);
      }
    },
    [onFieldChange]
  );

  const handleBack = React.useCallback(() => {
    if (employeeId) {
      navigate(`/employees/${employeeId}`);
    } else {
      navigate('/employees');
    }
  }, [navigate, employeeId]);

  const employeeFields: EmployeeField[] = [
    { key: 'name', label: 'Imię i nazwisko', type: 'text', required: true },
    { key: 'pesel', label: 'Pesel', type: 'string', required: false },
    { key: 'address', label: 'Adres', type: 'text', required: false },
    { key: 'email', label: 'E-mail', type: 'email', required: false },
    { key: 'phone', label: 'Telefon', type: 'text', required: false },
    {
      key: 'birthDate',
      label: 'Data urodzenia',
      type: 'date',
      required: false,
    },
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

  const contractFields: EmployeeField[] = [
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

  const a1Fields: EmployeeField[] = [
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

  const [cleared, setCleared] = useState<boolean>(false);

  useEffect(() => {
    if (cleared) {
      const timeout = setTimeout(() => {
        setCleared(false);
      }, 1500);

      return () => clearTimeout(timeout);
    }
    return () => {};
  }, [cleared]);

  const renderField = ({ key, label, type, required }: EmployeeField) => {
    if (type === 'boolean') {
      return (
        <Grid size={{ xs: 12 }} key={key}>
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(formValues[key])}
                onChange={(e) => handleFieldChange(key, e.target.checked)}
                name={key}
              />
            }
            label={label}
            required={required}
            name={key}
            inputRef={(el) => {
              if (props.registerFieldRef)
                props.registerFieldRef(key as string, el);
            }}
          />
        </Grid>
      );
    }

    if (type === 'date') {
      let val;
      if (formValues[key] instanceof Date) {
        val = dayjs(formValues[key] as Date);
      } else {
        val = null;
      }

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
              onChange={(newValue) => {
                handleFieldChange(key, newValue);
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  name: key,
                  required,
                  error: Boolean(formErrors[key]),
                  helperText: formErrors[key],
                },
                field: {
                  clearable: true,
                  onClear: () => setCleared(true),
                },
              }}
              name={key}
              disabled={
                (formValues.contractIsPermanent && key === 'contractEndDate') ??
                false
              }
              inputRef={(el) => {
                if (props.registerFieldRef)
                  props.registerFieldRef(key as string, el);
              }}
              // minDate={minD}
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
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">€</InputAdornment>
                ),
              },
            }}
            value={formValues[key] ?? ''}
            onChange={(e) => {
              const val = e.target.value.replace(/,/g, '.');

              const regex = /^\d*(?:\.\d*)?$/;

              if (val === '' || regex.test(val)) {
                handleFieldChange(key, val === '' ? null : val);
              }
            }}
            name={key}
            error={Boolean(formErrors[key])}
            helperText={formErrors[key]}
            inputRef={(el) => {
              if (props.registerFieldRef)
                props.registerFieldRef(key as string, el);
            }}
          />
        </Grid>
      );
    }

    return (
      <Grid size={{ xs: 12, md: 6 }} key={key}>
        <TextField
          size="small"
          required={required}
          fullWidth
          label={label}
          type={type}
          value={formValues[key] ?? ''}
          onChange={(e) => {
            let value: FormFieldValue = e.target.value;
            if (type === 'number') {
              value = e.target.value === '' ? null : Number(e.target.value);
            }
            handleFieldChange(key, value);
          }}
          name={key}
          error={Boolean(formErrors[key])}
          helperText={formErrors[key]}
          inputRef={(el) => {
            if (props.registerFieldRef)
              props.registerFieldRef(key as string, el);
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
      onReset={onReset}
      sx={{ width: '100%', position: 'relative' }}
    >
      <FormGroup>
        <Grid
          container
          columns={12}
          spacing={2.5}
          sx={{ position: 'relative', maxWidth: '100%' }}
        >

          <Grid width={'100%'}>
            <Alert severity="info" className="mb-3 px-3 py-0 font-medium">
              Pola oznaczone * są obowiązkowe.
            </Alert>
            <Typography variant="subtitle1" className="mb-3 font-medium">
              Dane pracownika
            </Typography>
            <Grid container columns={12} spacing={{ xs: 2 }} width={'100%'}>
              {employeeFields.map(renderField)}
              <Grid size={{ xs: 12 }}>
                <Stack direction={'row'} spacing={2} alignItems={'center'}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(formValues.isContractor)}
                        onChange={(e) =>
                          handleFieldChange('isContractor', e.target.checked)
                        }
                        name="isContractor"
                      />
                    }
                    label="Kontraktor"
                  />
                </Stack>
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: '100%' }} />

          <Grid width={'100%'}>
            <Typography variant="subtitle1" className="mb-3 font-medium">
              Umowa zatrudnienia
            </Typography>
            <Grid container columns={12} spacing={{ xs: 2 }}>
              {contractFields.map(renderField)}
              <Grid size={{ xs: 12 }} mt={-1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formValues.contractIsPermanent ?? false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        handleFieldChange('contractIsPermanent', checked);
                        if (checked) {
                          handleFieldChange('contractEndDate', null);
                        }
                      }}
                    />
                  }
                  label="Na czas nieokreślony"
                />
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: '100%' }} />

          <Grid width={'100%'}>
            <Typography variant="subtitle1" className="mb-3 font-medium">
              A1
            </Typography>
            <Grid container columns={12} spacing={{ xs: 2 }}>
              {a1Fields.map(renderField)}
            </Grid>
          </Grid>

          {!isEditForm && (
            <React.Fragment>
              <Divider sx={{ width: '100%' }} />
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" className="mb-3 font-medium">
                  Notatka
                </Typography>
                <Box sx={{ px: 0.2 }}>
                  <NoteBase
                    content={formValues.note ?? ''}
                    onChange={(note) => handleFieldChange('note', note)}
                    editable={true}
                  />
                </Box>
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
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            type="reset"
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
