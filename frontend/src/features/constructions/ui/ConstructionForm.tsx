import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormGroup from '@mui/material/FormGroup';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import Alert from '@mui/material/Alert';
import { Autocomplete, Divider, Paper, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import { NoteBase } from '@/shared/ui/Note';
import { Add } from '@mui/icons-material';
import { shouldBeInactive } from '@/entities/construction';
import { useContractors } from '@/entities/contractor';
import { AddContractorDialog } from '@/features/contractors';
import type { ConstructionFormState, FormFieldValue } from '../model/types';

type FieldType = 'text' | 'email' | 'date' | 'boolean';

interface ConstructionField {
  key: keyof ConstructionFormState['values'];
  labelKey: string;
  type: FieldType;
  required: boolean;
}

const CONSTRUCTION_FIELDS: ConstructionField[] = [
  { key: 'name', labelKey: 'form.fields.name', type: 'text', required: true },
  {
    key: 'location',
    labelKey: 'form.fields.location',
    type: 'text',
    required: false,
  },
  {
    key: 'contractorId',
    labelKey: 'form.fields.contractor',
    type: 'text',
    required: false,
  },
];

const DATE_FIELDS: ConstructionField[] = [
  {
    key: 'startDate',
    labelKey: 'form.fields.startDate',
    type: 'date',
    required: true,
  },
  {
    key: 'endDate',
    labelKey: 'form.fields.endDate',
    type: 'date',
    required: false,
  },
];

export interface ConstructionFormProps {
  formId?: string;
  formState: ConstructionFormState;
  onFieldChange: (
    name: keyof ConstructionFormState['values'],
    value: FormFieldValue
  ) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onReset?: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
  isEditForm?: boolean;
  registerFieldRef?: (name: string, el: HTMLInputElement | null) => void;
}

export function ConstructionForm(props: ConstructionFormProps) {
  const { t } = useTranslation(['constructions', 'common']);
  const {
    formId,
    formState,
    onFieldChange,
    onSubmit,
    onCancel,
    onReset,
    isSubmitting,
    submitError,
    isEditForm,
    registerFieldRef,
  } = props;

  const [contractorsModalOpen, setContractorsModalOpen] = useState(false);
  const [cleared, setCleared] = useState<boolean>(false);

  const { data: contractors, isLoading: contractorsIsLoading } =
    useContractors();

  const formValues = formState.values;
  const formErrors = formState.errors;

  const contractorsOptions = useMemo(() => {
    if (!contractors) return [];
    return contractors.map((contractor) => ({
      label: contractor.name,
      id: contractor.id,
    }));
  }, [contractors]);

  const handleCustomFieldChange = React.useCallback(
    (
      name: keyof ConstructionFormState['values'],
      value: string | boolean | Dayjs | null
    ) => {
      if (dayjs.isDayjs(value))
        onFieldChange(name, value.isValid() ? value.toDate() : null);
      else onFieldChange(name, value);
    },
    [onFieldChange]
  );

  useEffect(() => {
    if (cleared) {
      const timeout = setTimeout(() => setCleared(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [cleared]);

  const getDateValue = (value: any): Dayjs | null => {
    if (!value) return null;
    if (value instanceof Date) return dayjs(value);
    if (dayjs.isDayjs(value)) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = dayjs(value);
      return parsed.isValid() ? parsed : null;
    }
    return null;
  };

  const handleContractorAdded = (newId: string) => {
    handleCustomFieldChange('contractorId', newId);
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
        {t('form.sections.requiredInfo')}
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
          <Grid size={12}>
            <Typography variant="subtitle1" className="mb-3 font-medium">
              {t('form.sections.constructionData')}
            </Typography>
            <Grid container columns={12} spacing={2}>
              {CONSTRUCTION_FIELDS.map(({ key, labelKey, type, required }) => {
                const label = t(labelKey);
                const errorText = formErrors[key]
                  ? t(formErrors[key] as string)
                  : undefined;

                return (
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
                        onChange={(_, newValue) =>
                          handleCustomFieldChange(
                            key,
                            newValue ? (newValue.id as any) : null
                          )
                        }
                        slots={{
                          paper: ({ children, ...other }) => (
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
                                  {t('form.addContractor')}
                                </Button>
                              </Box>
                            </Paper>
                          ),
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            fullWidth
                            label={label}
                            name={key as string}
                            error={Boolean(formErrors[key])}
                            helperText={errorText}
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
                        name={key as string}
                        error={Boolean(formErrors[key])}
                        helperText={errorText}
                        inputRef={(el) => registerFieldRef?.(key as string, el)}
                        onChange={(e) =>
                          handleCustomFieldChange(key, e.target.value)
                        }
                      />
                    )}
                  </Grid>
                );
              })}
            </Grid>
          </Grid>

          <Divider sx={{ width: '100%' }} />

          <Grid size={12}>
            <Typography variant="subtitle1" className="mb-3 font-medium">
              {t('form.sections.dates')}
            </Typography>
            <Grid container columns={12} spacing={2}>
              {DATE_FIELDS.map(({ key, labelKey, required }) => {
                const label = t(labelKey);
                const errorText = formErrors[key]
                  ? t(formErrors[key] as string)
                  : undefined;

                return (
                  <Grid size={{ xs: 12, md: 6 }} key={key}>
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
                      onChange={(newValue) =>
                        handleCustomFieldChange(key, newValue)
                      }
                      minDate={
                        key === 'endDate'
                          ? dayjs(formValues['startDate'] as Date)
                          : undefined
                      }
                      maxDate={key === 'endDate' ? dayjs() : undefined}
                      inputRef={(el) => registerFieldRef?.(key as string, el)}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          name: key as string,
                          required,
                          error: Boolean(formErrors[key]),
                          helperText: errorText,
                        },
                        field: {
                          clearable: true,
                          onClear: () => setCleared(true),
                        },
                      }}
                    />
                  </Grid>
                );
              })}
            </Grid>
            {shouldBeInactive(formState.values.endDate) && (
              <Alert severity="warning" className="mt-3 px-3 py-0 font-medium">
                {t('form.finishedAlert')}
              </Alert>
            )}
          </Grid>

          {!isEditForm && (
            <React.Fragment>
              <Divider sx={{ width: '100%' }} />
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" className="mb-3 font-medium">
                  {t('form.sections.note')}
                </Typography>
                <Box sx={{ px: 0.2 }}>
                  <NoteBase
                    content={(formValues.note as string) ?? ''}
                    onChange={(note) => handleCustomFieldChange('note', note)}
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
            {isSubmitting
              ? t('common:buttons.saving')
              : t('common:buttons.save')}
          </Button>
          <Button
            variant="outlined"
            onClick={onCancel}
            startIcon={<ArrowBackIcon />}
            type="button"
            color="inherit"
            disabled={isSubmitting}
          >
            {t('common:buttons.cancel')}
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
