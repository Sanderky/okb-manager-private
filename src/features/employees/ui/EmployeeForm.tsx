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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { CheckCircleOutline } from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { NoteBase } from '@/shared/ui/Note';
import type { EmployeeFormState, FormFieldValue } from '../model/types';

type FieldType = 'text' | 'email' | 'date' | 'boolean' | 'string' | 'number';

interface EmployeeField {
  key: keyof EmployeeFormState['values'];
  labelKey: string;
  type: FieldType;
  required: boolean;
}

const EMPLOYEE_FIELDS: EmployeeField[] = [
  { key: 'name', labelKey: 'form.fields.name', type: 'text', required: true },
  {
    key: 'pesel',
    labelKey: 'form.fields.pesel',
    type: 'string',
    required: false,
  },
  {
    key: 'address',
    labelKey: 'form.fields.address',
    type: 'text',
    required: false,
  },
  {
    key: 'email',
    labelKey: 'form.fields.email',
    type: 'email',
    required: false,
  },
  {
    key: 'phone',
    labelKey: 'form.fields.phone',
    type: 'text',
    required: false,
  },
  {
    key: 'birthDate',
    labelKey: 'form.fields.birthDate',
    type: 'date',
    required: false,
  },
  {
    key: 'birthPlace',
    labelKey: 'form.fields.birthPlace',
    type: 'text',
    required: false,
  },
  {
    key: 'hourRate',
    labelKey: 'form.fields.hourRate',
    type: 'number',
    required: false,
  },
  {
    key: 'accountNumber',
    labelKey: 'form.fields.accountNumber',
    type: 'string',
    required: false,
  },
];

const CONTRACT_FIELDS: EmployeeField[] = [
  {
    key: 'contractStartDate',
    labelKey: 'form.fields.contractStartDate',
    type: 'date',
    required: false,
  },
  {
    key: 'contractEndDate',
    labelKey: 'form.fields.contractEndDate',
    type: 'date',
    required: false,
  },
];

const A1_FIELDS: EmployeeField[] = [
  {
    key: 'a1StartDate',
    labelKey: 'form.fields.a1StartDate',
    type: 'date',
    required: false,
  },
  {
    key: 'a1EndDate',
    labelKey: 'form.fields.a1EndDate',
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
  const { t } = useTranslation(['employees', 'common']);
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

  const renderField = ({ key, labelKey, type, required }: EmployeeField) => {
    const label = t(labelKey);
    const errorText = formErrors[key]
      ? t(formErrors[key] as string)
      : undefined;

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
                helperText: errorText,
              },
              field: { clearable: true, onClear: () => setCleared(true) },
            }}
          />
        </Grid>
      );
    }

    if (key === 'hourRate') {
      return (
        <Grid size={{ xs: 12, md: 6 }} key={key}>
          <TextField
            type="text"
            label={label}
            fullWidth
            size="small"
            required={required}
            value={formValues[key] ?? ''}
            name={key as string}
            error={Boolean(formErrors[key])}
            helperText={errorText}
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
          helperText={errorText}
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
              {t('form.sections.requiredInfo')}
            </Alert>
            <Typography variant="subtitle1" className="mb-3 font-medium">
              {t('form.sections.employeeData')}
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
                  label={t('form.sections.contractor')}
                />
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: '100%' }} />

          <Grid size={12}>
            <Typography variant="subtitle1" className="mb-3 font-medium">
              {t('form.sections.contract')}
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
                  label={t('form.sections.permanent')}
                />
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: '100%' }} />

          <Grid size={12}>
            <Typography variant="subtitle1" className="mb-3 font-medium">
              {t('form.sections.a1')}
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
                  {t('form.sections.note')}
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
            {t('common:buttons.save')}
          </Button>
          {isSubmitting && <Typography>{t('form.sections.saving')}</Typography>}
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
    </Box>
  );
}
