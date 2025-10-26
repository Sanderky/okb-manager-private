// ConstructionForm.tsx
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
import { Divider, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
        onFieldChange(name, value.isValid() ? value.toDate() : null);
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
