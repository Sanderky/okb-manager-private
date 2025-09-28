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
import type { Employee, EmployeeAttachment, FileItem } from '../../../types';
import Alert from '@mui/material/Alert';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import { Checkbox, Divider, FormControlLabel, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { FileUpload } from '@mui/icons-material';
import AttachmentBox from './AttachmentBox';
import { PreviewDialog } from '../../../components/fileBrowser/FilePreviewDialog';
import { type LoadingState } from './useAttachment';
import type { FileStateMap } from './EmployeeEdit';
import { handleDownloadAttachment } from './EmployeeEditHelpers';

export interface EmployeeFormState {
  values: Partial<Omit<Employee, 'id'>>;
  errors: Partial<Record<keyof EmployeeFormState['values'], string>>;
}

export type DateWithPermanent = { date: string | null; permanent: boolean };

export type FormFieldValue = string | boolean | null | DateWithPermanent;

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
  isFileLoading?: LoadingState | false;
  isEditForm?: boolean;
  onFileChange: (file: File | null, attachmentType: EmployeeAttachment) => void;
  filesState: FileStateMap;
}

type FieldType = 'text' | 'email' | 'date' | 'boolean' | 'object';

interface EmployeeField {
  key: keyof EmployeeFormState['values'];
  label: string;
  type: FieldType;
}

interface AttachmentFieldProps {
  attachmentType: EmployeeAttachment;
  onOpenPreview: (file: FileItem | null | undefined) => void;
  onFileChange: (file: File | null, attachmentType: EmployeeAttachment) => void;
  handleFieldChange: (
    name: keyof EmployeeFormState['values'],
    value: FormFieldValue | object | null
  ) => void;
  formState: EmployeeFormState;
}

const AttachmentField = ({
  attachmentType,
  onOpenPreview,
  formState,
  onFileChange,
  handleFieldChange,
}: AttachmentFieldProps) => {
  const handleUploadFileForm = (file: File | null) => {
    if (!file) return;
    onFileChange(file, attachmentType);
    handleFieldChange(attachmentType, {
      name: file.name,
      type: 'file',
      fullPath: '',
      url: URL.createObjectURL(file),
      contentType: file.type,
      size: file.size,
      // timeCreated: new Date().toISOString()
      timeCreated: '',
    });
  };

  const handleDeleteFileForm = () => {
    onFileChange(null, attachmentType);
    handleFieldChange(attachmentType, null);
  };

  const attachment = formState.values[attachmentType] ?? null;

  return (
    <Grid
      sx={{ position: 'relative' }}
      columns={12}
      spacing={{ xs: 2 }}
      width={'100%'}
      marginBottom={5}
      className="border-lightGray rounded-lg border p-3"
    >
      <Typography component="div" variant="body1" marginBottom={1}>
        Załącznik
      </Typography>
      {attachment && (
        <Alert severity="info" sx={{ marginBottom: 2 }}>
          Tylko jeden plik może być dodany. Usuń stary aby dodać nowy.
        </Alert>
      )}
      <AttachmentBox
        file={attachment}
        onShow={() => onOpenPreview(attachment)}
        onDelete={handleDeleteFileForm}
        onDownload={() => handleDownloadAttachment(attachment)}
      />
      {!attachment && (
        <Button
          component="label"
          variant="contained"
          startIcon={<FileUpload />}
        >
          Dodaj załącznik
          <input
            type="file"
            hidden
            onChange={(e) => handleUploadFileForm(e.target.files?.[0] || null)}
          />
        </Button>
      )}
    </Grid>
  );
};

export default function EmployeeForm(props: EmployeeFormProps) {
  const {
    formId,
    formState,
    onFieldChange,
    onSubmit,
    onReset,
    isSubmitting,
    isFileLoading,
    isEditForm,
    onFileChange,
  } = props;

  const formValues = formState.values;
  const formErrors = formState.errors;

  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const isFormLoading = isFileLoading !== false || isSubmitting;
  const handleFieldChange = React.useCallback(
    (
      name: keyof EmployeeFormState['values'],
      value: FormFieldValue | object | null
    ) => {
      if (dayjs.isDayjs(value)) {
        onFieldChange(
          name,
          value.isValid() ? value.format('YYYY-MM-DD') : null
        );
      } else {
        onFieldChange(name, value as FormFieldValue);
      }
    },
    [onFieldChange]
  );

  const handleDateFieldChange = (
    name: keyof EmployeeFormState['values'],
    newValue: Dayjs | null
  ) => {
    handleFieldChange(name, newValue?.format('YYYY-MM-DD') ?? null);
  };

  const handlePermanentChange = (
    name: keyof EmployeeFormState['values'],
    checked: boolean
  ) => {
    handleFieldChange(name, { date: null, permanent: checked });
  };

  const handlePermanentDateFieldChange = (
    name: keyof EmployeeFormState['values'],
    newValue: Dayjs | null
  ) => {
    handleFieldChange(name, {
      date: newValue?.format('YYYY-MM-DD') ?? null,
      permanent: false,
    });
  };

  const handleOpenPreview = useCallback((file: FileItem | null | undefined) => {
    if (!file) return;
    setPreviewFile(file);
    setIsPreviewOpen(true);
  }, []);

  const getDateValue = (
    key: keyof EmployeeFormState['values'],
    values: EmployeeFormState['values']
  ) => {
    const val = values[key];
    if (!val) return null;

    if (typeof val === 'string') return dayjs(val);
    if (typeof val === 'object' && 'date' in val && val.date)
      return dayjs(val.date);
    return null;
  };

  const employeeFields: EmployeeField[] = [
    { key: 'name', label: 'Imię i nazwisko', type: 'text' },
    { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'phone', label: 'Telefon', type: 'text' },
    { key: 'address', label: 'Adres', type: 'text' },
    // { key: 'status', label: 'Zatrudniony', type: 'boolean' },
  ];

  const contractFields: EmployeeField[] = [
    { key: 'contractStartDate', label: 'Data rozpoczęcia umowy', type: 'date' },
    { key: 'contractEndDate', label: 'Data wygaśnięcia umowy', type: 'object' },
  ];

  const a1Fields: EmployeeField[] = [
    { key: 'a1StartDate', label: 'Data rozpoczęcia umowy A1', type: 'date' },
    { key: 'a1EndDate', label: 'Data wygaśnięcia umowy A1', type: 'object' },
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
        <Grid container columns={12} spacing={1} sx={{ position: 'relative' }}>
          {isFormLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                zIndex: 1,
                borderRadius: 'inherit',
              }}
            />
          )}
          <Typography variant="subtitle1" className="mb-2 font-medium">
            Dane pracownika
          </Typography>
          <Grid container columns={12} spacing={{ xs: 2 }} width={'100%'}>
            {employeeFields.map(({ key, label, type }) => (
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
            Umowa zatrudnienia
          </Typography>
          <Grid container columns={12} spacing={{ xs: 2 }} width={'100%'}>
            <AttachmentField
              handleFieldChange={handleFieldChange}
              onFileChange={onFileChange}
              formState={formState}
              attachmentType="contractAttachment"
              onOpenPreview={handleOpenPreview}
            />
            {contractFields.map(({ key, label }) => (
              <Grid size={{ xs: 12, md: 6 }} key={key}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label={label}
                    value={getDateValue(key, formValues)}
                    onChange={(newValue) =>
                      key === 'contractEndDate'
                        ? handlePermanentDateFieldChange(key, newValue)
                        : handleDateFieldChange(key, newValue)
                    }
                    disabled={
                      key === 'contractEndDate' &&
                      formValues.contractEndDate?.permanent
                    }
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
            <Grid size={{ xs: 12 }} mt={-1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formValues.contractEndDate?.permanent ?? false}
                    onChange={(e) =>
                      handlePermanentChange('contractEndDate', e.target.checked)
                    }
                  />
                }
                label="Na czas nieokreślony"
              />
            </Grid>
          </Grid>
          <Divider sx={{ width: '100%' }} className="my-3" />
          <Typography variant="subtitle1" className="mb-2 font-medium">
            Umowa A1
          </Typography>
          <Grid container columns={12} spacing={{ xs: 2 }} width={'100%'}>
            <AttachmentField
              handleFieldChange={handleFieldChange}
              onFileChange={onFileChange}
              formState={formState}
              attachmentType="a1Attachment"
              onOpenPreview={handleOpenPreview}
            />
            {a1Fields.map(({ key, label }) => (
              <Grid size={{ xs: 12, md: 6 }} key={key}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label={label}
                    value={getDateValue(key, formValues)}
                    onChange={(newValue) =>
                      key === 'contractEndDate'
                        ? handlePermanentDateFieldChange(key, newValue)
                        : handleDateFieldChange(key, newValue)
                    }
                    disabled={
                      key === 'a1EndDate' && formValues.a1EndDate?.permanent
                    }
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
            <Grid size={{ xs: 12 }} mt={-1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formValues.a1EndDate?.permanent ?? false}
                    onChange={(e) =>
                      handlePermanentChange('a1EndDate', e.target.checked)
                    }
                  />
                }
                label="Na czas nieokreślony"
              />
            </Grid>
          </Grid>
          <Divider sx={{ width: '100%' }} className="my-3" />
          {isEditForm && (
            <Grid size={{ xs: 12 }} className="my-2">
              <TextField
                multiline
                minRows={5}
                maxRows={10}
                fullWidth
                label="Notatka"
                value={formValues.note ?? ''}
                onChange={(e) => handleFieldChange('note', e.target.value)}
                error={Boolean(formErrors.note)}
                helperText={formErrors.note}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(formValues['status'])}
                  onChange={(e) =>
                    handleFieldChange('status', e.target.checked)
                  }
                  name="status"
                />
              }
              label="Zatrudniony"
            />
          </Grid>
          <Divider sx={{ width: '100%' }} className="mt-3" />
        </Grid>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-start"
          spacing={3}
          sx={{ mt: 4 }}
        >
          <Button
            variant="contained"
            startIcon={<DoneAllOutlinedIcon />}
            type="submit"
            disabled={isFormLoading}
            loading={isFormLoading}
          >
            Zapisz
          </Button>
          {isFormLoading && (
            <Typography>
              {isSubmitting
                ? 'Zapisywanie danych...'
                : isFileLoading === 'uploading'
                  ? 'Przesyłanie plików...'
                  : 'Usuwanie plików...'}
            </Typography>
          )}
        </Stack>
      </FormGroup>
      <PreviewDialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={previewFile}
      />
    </Box>
  );
}
