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
import type {
  Attachment,
  Employee,
  EmployeeAttachment,
  FileItem,
} from '../../../types';
import Alert from '@mui/material/Alert';
import {
  Checkbox,
  Divider,
  FormControlLabel,
  InputAdornment,
  Switch,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { CheckCircleOutline, FileUpload } from '@mui/icons-material';
import AttachmentBox from './AttachmentBox';
import { PreviewDialog } from '../../../components/fileBrowser/FilePreviewDialog';
import type { FileStateMap } from './EmployeeEdit';
import { useNavigate, useParams } from 'react-router';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { LoadingState } from './useAttachment';
import { NoteBase } from '../../../components/Note';
import { plPL } from '@mui/x-date-pickers/locales';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../../firebase';
import { handleDownloadAttachment } from './EmployeesHelpers';

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
  | number
  | Attachment;

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
  registerFieldRef?: (name: string, el: HTMLInputElement | null) => void;
}

type FieldType = 'text' | 'email' | 'date' | 'boolean' | 'string' | 'number';

interface EmployeeField {
  key: keyof EmployeeFormState['values'];
  label: string;
  type: FieldType;
  required: boolean;
}

interface AttachmentFieldProps {
  attachmentType: EmployeeAttachment;
  onOpenPreview: (file: FileItem | File | null | undefined) => void;
  onFileChange: (file: File | null, attachmentType: EmployeeAttachment) => void;
  handleFieldChange: (
    name: keyof EmployeeFormState['values'],
    value: FormFieldValue | object | null
  ) => void;
  formState: EmployeeFormState;
  filesState: FileStateMap;
}

const AttachmentField = ({
  attachmentType,
  onOpenPreview,
  formState,
  onFileChange,
  handleFieldChange,
  filesState,
}: AttachmentFieldProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!attachment) {
      e.preventDefault();
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!attachment) {
      e.preventDefault();
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!attachment) {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleUploadFileForm(files[0]);
      }
    }
  };

  const handleOpenFileInNewTab = async (
    file: Attachment | null | undefined
  ) => {
    if (!file?.fullPath) return;

    try {
      const fileRef = ref(storage, file.fullPath);
      const downloadURL = await getDownloadURL(fileRef);

      const link = document.createElement('a');
      link.href = downloadURL;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    } catch (error) {
      console.error('Error opening file in new tab:', error);
    }
  };

  const handleUploadFileForm = (file: File | null) => {
    if (!file) return;
    onFileChange(file, attachmentType);
    handleFieldChange(attachmentType, {
      name: file.name,
      type: 'file',
      fullPath: '',
      attachmentType: attachmentType,
      contentType: file.type,
      size: file.size,
      timeCreated: new Date().toISOString(),
    } as Attachment);
  };

  const handleDeleteFileForm = () => {
    onFileChange(null, attachmentType);
    handleFieldChange(attachmentType, null);
  };

  const attachment = formState.values[attachmentType] ?? null;

  return (
    <Grid
      sx={{
        position: 'relative',
        backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.1)' : 'none',
        border: isDragging ? '1px dashed #1976d2 !important' : '',
      }}
      columns={12}
      spacing={{ xs: 2 }}
      width={'100%'}
      marginBottom={2}
      className="border-lightGray rounded-lg border p-3"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Typography component="div" variant="body1" marginBottom={1}>
        Załącznik
      </Typography>
      {attachment && (
        <Alert severity="info" className="mb-3 px-3 py-0">
          Tylko jeden plik może być dodany. Usuń stary aby dodać nowy.
        </Alert>
      )}
      {filesState[attachmentType] && (
        <Alert severity="warning" className="mb-3 px-3 py-0">
          Plik zostanie przesłany dopiero po zapisaniu formularza.
        </Alert>
      )}
      <AttachmentBox
        file={attachment}
        onShow={() => onOpenPreview(filesState[attachmentType] ?? attachment)}
        onDelete={handleDeleteFileForm}
        onDownload={
          filesState[attachmentType]
            ? undefined
            : () => handleDownloadAttachment(attachment)
        }
        onNewCard={
          filesState[attachmentType]
            ? undefined
            : () => handleOpenFileInNewTab(attachment)
        }
      />
      {!attachment && (
        <Stack
          alignItems={'center'}
          spacing={1}
          direction={'row'}
          sx={{ flexWrap: 'wrap' }}
        >
          <Button
            size="small"
            component="label"
            variant="contained"
            startIcon={<FileUpload />}
          >
            Dodaj załącznik
            <input
              type="file"
              hidden
              onChange={(e) =>
                handleUploadFileForm(e.target.files?.[0] || null)
              }
            />
          </Button>
          <Typography variant="caption">lub przeciągnij i upuść</Typography>
        </Stack>
      )}
    </Grid>
  );
};

export default function EmployeeForm(props: EmployeeFormProps) {
  const {
    formId,
    formState,
    filesState,
    onFieldChange,
    onSubmit,
    onReset,
    isSubmitting,
    isFileLoading = false,
    isEditForm,
    onFileChange,
  } = props;

  const formValues = formState.values;
  const formErrors = formState.errors;

  const [previewFile, setPreviewFile] = useState<FileItem | File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const isFormLoading = isFileLoading !== false || isSubmitting;

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

  const handleOpenPreview = useCallback(
    (file: FileItem | File | null | undefined) => {
      if (!file) return;
      setPreviewFile(file);
      setIsPreviewOpen(true);
    },
    []
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

      // let minD = undefined;

      // if (key === 'a1EndDate') {
      //   minD = dayjs(formValues.a1StartDate);
      // }

      // if (key === 'contractEndDate') {
      //   minD = dayjs(formValues.contractStartDate);
      // }

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
                (formValues.contractISPermanent && key === 'contractEndDate') ??
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
                <Stack
                  direction={'row'}
                  spacing={2}
                  alignItems={'center'}
                  // className="border-lightGray w-full rounded-lg border p-2 px-4"
                >
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
                  {/* <Divider orientation="vertical" flexItem variant="middle" />
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(formValues.status)}
                      onChange={(e) =>
                        handleFieldChange('status', e.target.checked)
                      }
                      name="status"
                      color={formValues.status ? 'success' : 'error'}
                    />
                  }
                  label="Aktywny"
                /> */}
                </Stack>
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: '100%' }} />

          <Grid width={'100%'}>
            <Typography variant="subtitle1" className="mb-3 font-medium">
              Dowód osobisty
            </Typography>
            <Grid container columns={12} spacing={{ xs: 2 }}>
              <AttachmentField
                handleFieldChange={handleFieldChange}
                onFileChange={onFileChange}
                formState={formState}
                attachmentType="idAttachment"
                onOpenPreview={handleOpenPreview}
                filesState={filesState}
              />
            </Grid>
          </Grid>

          <Divider sx={{ width: '100%' }} />

          <Grid width={'100%'}>
            <Typography variant="subtitle1" className="mb-3 font-medium">
              Umowa zatrudnienia
            </Typography>
            <Grid container columns={12} spacing={{ xs: 2 }}>
              <AttachmentField
                handleFieldChange={handleFieldChange}
                onFileChange={onFileChange}
                formState={formState}
                attachmentType="contractAttachment"
                onOpenPreview={handleOpenPreview}
                filesState={filesState}
              />
              {contractFields.map(renderField)}
              <Grid size={{ xs: 12 }} mt={-1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formValues.contractISPermanent ?? false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        handleFieldChange('contractISPermanent', checked);
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
              <AttachmentField
                handleFieldChange={handleFieldChange}
                onFileChange={onFileChange}
                formState={formState}
                attachmentType="a1Attachment"
                onOpenPreview={handleOpenPreview}
                filesState={filesState}
              />
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
            disabled={isFormLoading}
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
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            type="reset"
            color="inherit"
            disabled={isFormLoading}
          >
            Anuluj
          </Button>
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
