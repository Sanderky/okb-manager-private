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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pl';
import type { Construction } from '../../../types';
import { useTranslation } from 'react-i18next';


export interface ConstructionFormState {
  values: Partial<Omit<Construction, 'id'>>;
  errors: Partial<Record<keyof ConstructionFormState['values'], string>>;
}

export type FormFieldValue = string | string[] | number | boolean | File | null;

export interface ConstructionFormProps {
  formState: ConstructionFormState;
  onFieldChange: (
    name: keyof ConstructionFormState['values'],
    value: FormFieldValue,
  ) => void;
  onSubmit: (formValues: Partial<ConstructionFormState['values']>) => Promise<void>;
  onReset?: (formValues: Partial<ConstructionFormState['values']>) => void;
  submitButtonLabel: string;
  backButtonPath?: string;
}

export default function ConstructionForm(props: ConstructionFormProps) {
  const {
    formState,
    onFieldChange,
    onSubmit,
    onReset,
    submitButtonLabel,
    backButtonPath,
  } = props;

  const formValues = formState.values;
  const formErrors = formState.errors;

  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setIsSubmitting(true);
      try {
        await onSubmit(formValues);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formValues, onSubmit],
  );

  const handleTextFieldChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFieldChange(
        event.target.name as keyof ConstructionFormState['values'],
        event.target.value,
      );
    },
    [onFieldChange],
  );

  // const handleNumberFieldChange = React.useCallback(
  //   (event: React.ChangeEvent<HTMLInputElement>) => {
  //     onFieldChange(
  //       event.target.name as keyof ConstructionFormState['values'],
  //       Number(event.target.value),
  //     );
  //   },
  //   [onFieldChange],
  // );

  // const handleCheckboxFieldChange = React.useCallback(
  //   (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
  //     onFieldChange(event.target.name as keyof ConstructionFormState['values'], checked);
  //   },
  //   [onFieldChange],
  // );

  const handleDateFieldChange = React.useCallback(
    (fieldName: keyof ConstructionFormState['values']) => (value: Dayjs | null) => {
      if (value?.isValid()) {
        onFieldChange(fieldName, value.toISOString() ?? null);
      } else if (formValues[fieldName]) {
        onFieldChange(fieldName, null);
      }
    },
    [formValues, onFieldChange],
  );

  // const handleSelectFieldChange = React.useCallback(
  //   (event: SelectChangeEvent) => {
  //     onFieldChange(
  //       event.target.name as keyof ConstructionFormState['values'],
  //       event.target.value,
  //     );
  //   },
  //   [onFieldChange],
  // );

  const handleReset = React.useCallback(() => {
    if (onReset) {
      onReset(formValues);
    }
  }, [formValues, onReset]);

  const handleBack = React.useCallback(() => {
    navigate(backButtonPath ?? '/constructions');
  }, [navigate, backButtonPath]);

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      autoComplete="off"
      onReset={handleReset}
      sx={{ width: '100%' }}
    >
      <FormGroup>
        <Grid container spacing={2} sx={{ mb: 2, width: '100%' }}>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <TextField
              value={formValues.name ?? ''}
              onChange={handleTextFieldChange}
              name="name"
              label={t('constructions.name')}
              error={!!formErrors.name}
              helperText={formErrors.name ?? ' '}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <TextField
              value={formValues.location ?? ''}
              onChange={handleTextFieldChange}
              name="location"
              label={t('constructions.location')}
              error={!!formErrors.location}
              helperText={formErrors.location ?? ' '}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <TextField
              value={formValues.contractor ?? ''}
              onChange={handleTextFieldChange}
              name="contractor"
              label={t('constructions.contractor')}
              error={!!formErrors.contractor}
              helperText={formErrors.contractor ?? ' '}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='pl'>
              <DatePicker
                value={formValues.startDate ? dayjs(formValues.startDate) : null}
                onChange={handleDateFieldChange('startDate')}
                name="startDate"
                label={t('constructions.startDate')}
                slotProps={{
                  textField: {
                    error: !!formErrors.startDate,
                    helperText: formErrors.startDate ?? ' ',
                    fullWidth: true,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </FormGroup>
      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          {t('menu.back')}
        </Button>
        <Button
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
        >
          {submitButtonLabel}
        </Button>
      </Stack>
    </Box>
  );
}
