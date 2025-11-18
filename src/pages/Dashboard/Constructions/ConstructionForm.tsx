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
import { Divider, FormControlLabel, Switch, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { NoteBase } from '../../../components/Note';
import { plPL } from '@mui/x-date-pickers/locales';

export interface ConstructionFormState {
  values: Partial<Omit<Construction, 'id'>>;
  errors: Partial<Record<keyof ConstructionFormState['values'], string>>;
}

export type FormFieldValue = string | Date | number | boolean | null;

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
  registerFieldRef?: (name: string, el: HTMLInputElement | null) => void;
}

type FieldType = 'text' | 'email' | 'date' | 'boolean';

interface ConstructionField {
  key: keyof ConstructionFormState['values'];
  label: string;
  type: FieldType;
  required: boolean;
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
    { key: 'name', label: 'Nazwa budowy', type: 'text', required: true },
    { key: 'location', label: 'Lokalizacja', type: 'text', required: false },
    { key: 'contractor', label: 'Wykonawca', type: 'text', required: false },
  ];

  const DateFields: ConstructionField[] = [
    {
      key: 'startDate',
      label: 'Data rozpoczęcia',
      type: 'date',
      required: true,
    },
    {
      key: 'endDate',
      label: 'Data zakończenia',
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

  const handleBack = React.useCallback(() => {
    if (constructionId) {
      navigate(`/constructions/${constructionId}`);
    } else {
      navigate('/constructions');
    }
  }, [navigate, constructionId]);

  const getDateValue = (value: any): Dayjs | null => {
    if (!value) return null;

    if (value instanceof Date) {
      return dayjs(value);
    }

    if (dayjs.isDayjs(value)) {
      return value;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = dayjs(value);
      return parsed.isValid() ? parsed : null;
    }

    return null;
  };

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
      <Alert severity="info" className="mb-3 px-3 py-0 font-medium">
        Pola oznaczone * są obowiązkowe.
      </Alert>
      {submitError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          className="mb-3 px-3 py-0 font-medium"
        >
          {submitError}
        </Alert>
      )}
      <FormGroup>
        <Grid
          container
          columns={12}
          spacing={2.5}
          sx={{ position: 'relative', maxWidth: '100%' }}
        >
          <Grid width={'100%'}>
            <Typography variant="subtitle1" className="mb-3 font-medium">
              Dane budowy
            </Typography>
            <Grid container columns={12} spacing={{ xs: 2 }}>
              {constructionFields.map(({ key, label, type, required }) => (
                <Grid size={{ xs: 12, md: 6 }} key={key}>
                  <TextField
                    size="small"
                    required={required}
                    fullWidth
                    label={label}
                    type={type}
                    value={formValues[key] ?? ''}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    name={key}
                    error={Boolean(formErrors[key])}
                    helperText={formErrors[key]}
                    inputRef={(el) => {
                      if (props.registerFieldRef)
                        props.registerFieldRef(key as string, el);
                    }}
                  />
                </Grid>
              ))}
              {!isEditForm && (
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formValues.status ?? true}
                        onChange={(e) =>
                          handleFieldChange('status', e.target.checked)
                        }
                        name="status"
                        color="primary"
                      />
                    }
                    label="Aktywna budowa"
                  />
                </Grid>
              )}
            </Grid>
          </Grid>
          <Divider sx={{ width: '100%' }} />
          <Grid width={'100%'}>
            <Typography variant="subtitle1" className="mb-3 font-medium">
              Terminy
            </Typography>
            <Grid container columns={12} spacing={{ xs: 2 }}>
              {DateFields.map(({ key, label, required }) => (
                <Grid size={{ xs: 12, md: 6 }} key={key}>
                  <LocalizationProvider
                    localeText={
                      plPL.components.MuiLocalizationProvider.defaultProps
                        .localeText
                    }
                    dateAdapter={AdapterDayjs}
                    adapterLocale="pl"
                  >
                    <DatePicker
                      openTo="month"
                      views={['year', 'month', 'day']}
                      label={label}
                      value={getDateValue(formValues[key])}
                      onChange={(newValue) => handleFieldChange(key, newValue)}
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
                      inputRef={(el) => {
                        if (props.registerFieldRef)
                          props.registerFieldRef(key as string, el);
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
              ))}
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
            color="inherit"
          >
            Anuluj
          </Button>
        </Stack>
      </FormGroup>
    </Box>
  );
}
