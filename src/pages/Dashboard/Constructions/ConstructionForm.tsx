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
import type { Construction } from '../../../types';
import Alert from '@mui/material/Alert';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import { Divider, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export interface ConstructionFormState {
  values: Partial<Omit<Construction, 'id'>>;
  errors: Partial<Record<keyof ConstructionFormState['values'], string>>;
}

export type FormFieldValue = string | Date | number | boolean | File | null;

export interface ConstructionFormProps {
  formId?: string;
  formState: ConstructionFormState;
  onFieldChange: (
    name: keyof ConstructionFormState['values'],
    value: FormFieldValue
  ) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset?: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
  isEditForm?: boolean;
}

type FieldType = 'text' | 'email' | 'date' | 'boolean';

interface ConstructionField {
  key: keyof ConstructionFormState['values'];
  label: string;
  type: FieldType;
}

export const validate = (
  values: Partial<Omit<Construction, 'id'>>
): Partial<Record<keyof ConstructionFormState['values'], string>> => {
  const errors: Partial<Record<keyof ConstructionFormState['values'], string>> =
    {};

  if (!values.name) {
    errors.name = 'Nazwa jest wymagana.';
  }

  if (values.name && values.name.length > 100) {
    errors.name = 'Nazwa nie może być dłuższa niż 100 znaków.';
  }

  // if (values.email && values.email.length > 100) {
  //   errors.email = 'E-mail nie może być dłuższy niż 100 znaków.';
  // }

  // if (values.email && !/\S+@\S+\.\S+/.test(values.email)) {
  //   errors.email = 'Nieprawidłowy format adresu e-mail.';
  // }

  // if (
  //   values.contractStartDate &&
  //   values.contractEndDate &&
  //   dayjs(values.contractEndDate).isBefore(dayjs(values.contractStartDate))
  // ) {
  //   errors.contractEndDate =
  //     'Data wygaśnięcia umowy nie może być wcześniejsza niż data rozpoczęcia umowy.';
  // }

  // if (
  //   values.a1StartDate &&
  //   values.a1EndDate &&
  //   dayjs(values.a1EndDate).isBefore(dayjs(values.a1StartDate))
  // ) {
  //   errors.a1EndDate =
  //     'Data wygaśnięcia umowy nie może być wcześniejsza niż data rozpoczęcia umowy.';
  // }

  return errors;
};

export default function ConstructionForm(props: ConstructionFormProps) {
  const {
    formId,
    formState,
    onFieldChange,
    onSubmit,
    onReset,
    isSubmitting,
    submitError,
    isEditForm,
  } = props;

  const formValues = formState.values;
  const formErrors = formState.errors;

  const navigate = useNavigate();
  const { constructionId } = useParams<{ constructionId: string }>();

  const handleFieldChange = React.useCallback(
    (
      name: keyof ConstructionFormState['values'],
      value: string | boolean | Dayjs | null
    ) => {
      if (dayjs.isDayjs(value)) {
        onFieldChange(name, value.toDate());
      } else {
        onFieldChange(name, value);
      }
    },
    [onFieldChange]
  );

  const constructionFields: ConstructionField[] = [
    { key: 'name', label: 'Nazwa budowy', type: 'text' },
    { key: 'location', label: 'Lokalizacja', type: 'text' },
    { key: 'contractor', label: 'Wykonawca', type: 'text' },
  ];

  const DateFields: ConstructionField[] = [
    { key: 'startDate', label: 'Data rozpoczęcia', type: 'date' },
    { key: 'endDate', label: 'Data zakończenia', type: 'date' },
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

  const handleBack = React.useCallback(() => {
    if (constructionId) {
      navigate(`/constructions/${constructionId}`);
    } else {
      navigate('/constructions');
    }
  }, [navigate, constructionId]);

  return (
    <Box
      id={formId}
      component="form"
      onSubmit={onSubmit}
      noValidate
      autoComplete="off"
      onReset={onReset}
      sx={{ width: '100%', overflowY: 'auto' }}
    >
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}
      <FormGroup>
        <Grid container columns={12} spacing={1}>
          <Typography variant="subtitle1" className="mb-2 font-medium">
            Dane budowy
          </Typography>
          <Grid container columns={12} spacing={{ xs: 2 }} width={'100%'}>
            {constructionFields.map(({ key, label, type }) => (
              <Grid size={{ xs: 12, md: 6 }} key={key}>
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
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ width: '100%' }} className="my-3" />
          <Typography variant="subtitle1" className="mb-2 font-medium">
            Terminy
          </Typography>
          <Grid container columns={12} spacing={{ xs: 2 }} width={'100%'}>
            {DateFields.map(({ key, label, type }) => (
              <Grid size={{ xs: 12, md: 6 }} key={key}>
                <LocalizationProvider
                  dateAdapter={AdapterDayjs}
                  adapterLocale="pl"
                >
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
                      field: {
                        clearable: true,
                        onClear: () => setCleared(true),
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ width: '100%' }} className="my-3" />
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
            startIcon={<CheckCircleOutlineIcon />}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
          </Button>
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            type="reset"
          >
            Anuluj
          </Button>
        </Stack>
      </FormGroup>
    </Box>
  );
}
