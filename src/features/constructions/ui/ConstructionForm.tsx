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
import Alert from '@mui/material/Alert';
import { Autocomplete, Divider, Paper, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { NoteBase } from '@/shared/ui/Note';
import { plPL } from '@mui/x-date-pickers/locales';
import { Add } from '@mui/icons-material';
import { shouldBeInactive, type Construction } from '@/entities/construction';
import { useContractors } from '@/entities/contractor';
import { AddContractorDialog } from '@/features/contractors';

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

export function ConstructionForm(props: ConstructionFormProps) {
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

  const [contractorsModalOpen, setContractorsModalOpen] = useState(false);

  const { data: contractors, isLoading: contractorsIsLoading } = useContractors();

  const contractorsOptions = useMemo(() => {
    if (!contractors) return [];
    return contractors.map((contractor) => ({
      label: contractor.name,
      id: contractor.id,
    }));
  }, [contractors]);

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
    { key: 'contractorId', label: 'Wykonawca', type: 'text', required: false },
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

  const handleContractorAdded = (newId: string) => {
    handleFieldChange('contractorId', newId);
    setContractorsModalOpen(false);
  };

  return (
    <Box
      id={formId}
      component="form"
      onSubmit={onSubmit}
      noValidate
      autoComplete="off"
      onReset={onReset}
      sx={{ width: '100%', overflowY: 'auto', position: 'relative' }}
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
                  {key === 'contractorId' ? (
                    <Autocomplete
                      options={contractorsOptions}
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                      }
                      loading={contractorsIsLoading}
                      value={
                        contractorsOptions.find(
                          (c) => c.id === formValues[key]
                        ) || null
                      }
                      onChange={(_, newValue) => {
                        handleFieldChange(
                          key,
                          newValue ? (newValue.id as any) : null
                        );
                      }}
                      slots={{
                        paper: (props) => {
                          const { children, ...other } = props;
                          return (
                            <Paper {...other}>
                              {children}
                              <Divider />
                              <Box
                                onMouseDown={(e) => e.preventDefault()}
                                sx={{ p: 1 }}
                              >
                                <Button
                                  fullWidth
                                  variant="text"
                                  size="small"
                                  startIcon={<Add />}
                                  onClick={() => setContractorsModalOpen(true)}
                                >
                                  Dodaj wykonawcę
                                </Button>
                              </Box>
                            </Paper>
                          );
                        },
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          fullWidth
                          label={label}
                          name={key}
                          error={Boolean(formErrors[key])}
                          helperText={formErrors[key]}
                        />
                      )}
                    />
                  ) : (
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
                  )}
                </Grid>
              ))}
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
                      disabled={Boolean(
                        key === 'endDate' &&
                          (!formValues['startDate'] ||
                            dayjs(formValues['startDate']).isAfter(dayjs()))
                      )}
                      value={getDateValue(formValues[key])}
                      onChange={(newValue) => handleFieldChange(key, newValue)}
                      minDate={
                        key === 'endDate'
                          ? dayjs(formValues['startDate'])
                          : undefined
                      }
                      maxDate={key === 'endDate' ? dayjs() : undefined}
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
            {shouldBeInactive(formState.values.endDate) && (
              <Alert severity="warning" className="mt-3 px-3 py-0 font-medium">
                Budowa zostanie oznaczona jako zakończona.
              </Alert>
            )}
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
                    content={(formValues.note as string) ?? ''}
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
            disabled={isSubmitting}
          >
            Anuluj
          </Button>
        </Stack>
      </FormGroup>

      <AddContractorDialog
        open={contractorsModalOpen}
        onClose={() => setContractorsModalOpen(false)}
        onAddSuccess={handleContractorAdded}
      />
    </Box>
  );
}
