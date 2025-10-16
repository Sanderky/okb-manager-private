import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router';

import PageContainer from '../../../components/PageContainer';

import { type Employee, type FileItem } from '../../../types';
import { getEmployee, updateEmployee } from '../../../api/employees';

import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';

import {
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import { useParams } from 'react-router';
import dayjs from 'dayjs';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import AttachmentBox from './AttachmentBox';
import { PreviewDialog } from '../../../components/fileBrowser/FilePreviewDialog';
import { handleDownloadAttachment } from './EmployeeEditHelpers';

import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CheckIcon from '@mui/icons-material/Check';
import type { EmployeeFormState } from './EmployeeForm';

// Extended async status & helpers
// interface NormalizedError {
//   message: string;
//   code?: string;
//   raw?: unknown;
// }

// function normalizeError(err: unknown): NormalizedError {
//   if (err instanceof Error) {
//     const anyErr = err as any;
//     const code = typeof anyErr.code === 'string' ? anyErr.code : undefined;
//     return { message: err.message || 'Wystąpił nieznany błąd', code, raw: err };
//   }
//   return { message: 'Wystąpił nieznany błąd', raw: err };
// }

const personalFields = [
  { key: 'name', label: 'Imię' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Telefon' },
  { key: 'address', label: 'Adres' },
];

const contractFields = [
  { key: 'contractStartDate', label: 'Data rozpoczęcia umowy' },
  { key: 'contractEndDate', label: 'Data wygaśnięcia umowy' },
];

const a1Fields = [
  { key: 'a1StartDate', label: 'Data rozpoczęcia umowy' },
  { key: 'a1EndDate', label: 'Data wygaśnięcia umowy' },
];

const generateDateBox = (
  key: keyof Employee,
  label: string,
  employee: Employee | null
) => {
  if (!employee) return null;

  const endDate =
    key === 'contractEndDate'
      ? employee.contractEndDate
      : key === 'a1EndDate'
        ? employee.a1EndDate
        : null;

  const isPermanent =
    key === 'contractEndDate' ? employee.contractISPermanent : false;
  const isEndDateField = key === 'contractEndDate' || key === 'a1EndDate';

  const today = dayjs().startOf('day');
  let daysDiff: number | null = null;

  if (endDate) {
    daysDiff = dayjs(endDate).startOf('day').diff(today, 'day');
  }

  let dateStyles = '';
  let severity: 'error' | 'warning' = 'warning';
  let message = '';
  let dayWord = 'dni';

  if (isEndDateField && endDate && !isPermanent) {
    if (Math.abs(daysDiff!) === 1) dayWord = 'dzień';

    if (daysDiff! <= 14) {
      dateStyles = 'border-red-500/25! bg-red-600/10! text-red-800!';
      severity = 'error';
      message =
        daysDiff! < 0
          ? `Umowa wygasła ${Math.abs(daysDiff!)} ${dayWord} temu`
          : daysDiff! === 0
            ? `Umowa kończy się dziś`
            : `Umowa kończy się za ${daysDiff!} ${dayWord}`;
    } else if (daysDiff! <= 30) {
      dateStyles = 'border-amber-500/25! bg-amber-500/10! text-amber-600!';
      severity = 'warning';
      message = `Umowa kończy się za ${daysDiff!} ${dayWord}`;
    }
  } else if (isPermanent) {
    dateStyles = 'border-amber-500/25! bg-amber-500/10! text-amber-600!';
  }

  let displayValue: React.ReactNode;

  if (key === 'contractEndDate' && isPermanent) {
    displayValue = 'Umowa na czas nieokreślony';
  } else if (endDate instanceof Date) {
    displayValue = dayjs(endDate).format('DD.MM.YYYY');
  } else {
    displayValue = <em className="text-gray-400">Brak</em>;
  }

  return (
    <Grid key={key} size={{ xs: 12 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="flex-start"
        alignItems={{ xs: 'flex-start', lg: 'center' }}
        spacing={{ xs: 1, lg: 2 }}
        sx={{ width: '100%' }}
      >
        <Typography variant="body1" className="font-medium">
          {label}:
        </Typography>
        <Typography
          variant="body1"
          className={`border-lightGray rounded border px-3 py-1 text-gray-700 ${dateStyles}`}
        >
          {displayValue}
        </Typography>
      </Stack>

      {isEndDateField && endDate && !isPermanent && daysDiff !== null && (
        <Alert severity={severity} sx={{ width: '100%', mt: 2 }}>
          <Typography variant="body2">{message}</Typography>
        </Alert>
      )}
    </Grid>
  );
};

export default function EmployeeShow() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notFound, setNotFound] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const [editNote, setEditNote] = useState(false);

  const notifications = useNotifications();

  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const [note, setNote] = useState('');
  const [tab, setTab] = useState(0);

  const handleOpenPreview = useCallback((file: FileItem | null | undefined) => {
    if (!file) return;
    setPreviewFile(file);
    setIsPreviewOpen(true);
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const {
    data: employee,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => getEmployee(employeeId!),
    enabled: !!employeeId,
  });

  // useEffect(() => {
  //   if (employee) {
  //     setNote(employee.note ?? '');
  //     setNotFound(false);
  //   } else if (!isLoading) {
  //     setNotFound(true);
  //   }
  // }, [employee, isLoading]);

  // const {handleDownloadAttachment} = useEmployeeAttachment(employee)

  const updateNoteMutation = useMutation({
    mutationFn: (newNote: string) =>
      updateEmployee(employeeId!, { note: newNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
  });

  const handleSaveNote = useCallback(async () => {
    const currentNote = employee?.note ?? '';
    if (currentNote === note) {
      return;
    }
    setEditNote(false);
    notifications.show('Pomyślnie zaktualizowano notatkę.', {
      severity: 'success',
      autoHideDuration: 3000,
    });
    updateNoteMutation.mutate(note);
  }, [employee?.note, note, updateNoteMutation, notifications]);

  const handleEmployeeEdit = useCallback(() => {
    navigate(`/employees/${employeeId}/edit`);
  }, [navigate, employeeId]);

  const handleBack = useCallback(() => {
    navigate('/employees');
  }, [navigate]);

  const renderShow = useMemo(() => {
    if (isLoading) {
      return (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            m: 1,
          }}
        >
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Ładowanie danych pracownika...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ flexGrow: 1, width: '100%' }}>
          <Alert
            severity="error"
            // action={
            //   <Stack direction="row" spacing={1}>
            //     <Button
            //       size="small"
            //       onClick={() => setShowDebug((v) => !v)}
            //       variant="text"
            //     >
            //       {showDebug ? 'Ukryj' : 'Szczegóły'}
            //     </Button>
            //   </Stack>
            // }
          >
            {error.message}
          </Alert>
          {/* {showDebug && (
            <Paper sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }} variant="outlined">
              <Typography
                variant="caption"
                component="pre"
                sx={{ m: 0, whiteSpace: 'pre-wrap' }}
              >
                {JSON.stringify(error.raw, null, 2)}
              </Typography>
            </Paper>
          )} */}
        </Box>
      );
    }

    if (notFound) {
      return (
        <Box sx={{ width: '100%' }}>
          <Alert severity="info">
            Nie znaleziono pracownika. Mógł zostać usunięty lub nie istnieje.
          </Alert>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleBack}>
              Wróć
            </Button>
            {/* <Button variant="outlined" onClick={handleRetry}>
              Spróbuj ponownie
            </Button> */}
          </Stack>
        </Box>
      );
    }

    return employee ? (
      <Box
        sx={{ width: '100%' }}
        className="border-lightGray rounded-lg border bg-white p-4 md:p-6 md:pt-4"
      >
        <Grid
          container
          spacing={2}
          alignItems={'center'}
          columns={12}
          sx={{ mb: 2 }}
        >
          <Grid
            size={{ xs: 12, sm: 8 }}
            sx={{ width: '100%!important' }}
            mb={1.5}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Tabs value={tab} onChange={handleTabChange}>
                <Tab
                  label="Informacje"
                  sx={{
                    fontSize: { xs: '0.8rem', sm: '.85rem' },
                    padding: 2,
                    minWidth: 0,
                  }}
                />
                <Tab
                  label="Pliki"
                  sx={{
                    fontSize: { xs: '0.8rem', sm: '.85rem' },
                    padding: 2,
                    minWidth: { xs: 0, sm: 100 },
                  }}
                />
              </Tabs>
              <Stack
                direction="row"
                justifyContent="flex-end"
                flexGrow={1}
                spacing={{ xs: 1.5, sm: 3 }}
                sx={{ pl: 1 }}
              >
                <IconButton
                  onClick={handleEmployeeEdit}
                  color="primary"
                  className="rounded-full border border-blue-300"
                >
                  <EditIcon />
                </IconButton>
                {/* {isInProgress ? (
                  <IconButton
                    onClick={openEndDialog}
                    color="warning"
                    className="rounded-full border border-amber-500 bg-amber-50/50"
                    title="Zakończ budowę"
                  >
                    <EventAvailableIcon />
                  </IconButton>
                ) : (
                  <IconButton
                    onClick={handleResume}
                    color="success"
                    className="rounded-full border border-green-500 bg-green-50/50"
                    title="Wznów budowę"
                  >
                    <EventRepeatIcon />
                  </IconButton>
                )} */}
              </Stack>
            </Stack>
          </Grid>
        </Grid>
        {tab === 0 && (
          <Grid container spacing={{ xs: 2, lg: 3 }} columns={12}>
            <Grid size={{ xs: 12, lg: 6 }} sx={{ flexGrow: 1 }}>
              <Grid container spacing={2}>
                {personalFields.map(({ key, label }) => (
                  <Grid
                    key={key}
                    size={{ xs: 12 }}
                    className="border-b border-gray-300 pb-3"
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent={'space-between'}
                      spacing={2}
                    >
                      <Typography
                        variant="body1"
                        className="font-medium text-gray-600"
                        sx={{ minWidth: 120 }}
                      >
                        {label}:
                      </Typography>
                      <Typography
                        variant="body1"
                        className="text-dark font-semibold"
                        sx={{
                          maxWidth: '100%',
                          overflow: 'visible',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          pr: 2,
                        }}
                        // noWrap
                      >
                        {(() => {
                          const value = employee[key as keyof Employee];
                          if (!value) {
                            return <em className="text-gray-400">-</em>;
                          }
                          return String(value);
                        })() || <em className="text-gray-400">-</em>}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
              <Box className="mt-8 rounded-lg border border-dashed border-gray-300 p-4">
                <Stack
                  spacing={1.5}
                  direction={'column'}
                  alignItems={'flex-start'}
                >
                  <Stack
                    direction="row"
                    alignItems={'center'}
                    sx={{ width: '100%' }}
                    spacing={2}
                  >
                    <Typography variant="body1" className="mb-2 font-medium">
                      Notatka:
                    </Typography>
                    <Stack
                      direction="row"
                      sx={{ width: '100%' }}
                      justifyContent={'flex-end'}
                      alignItems="center"
                      spacing={2}
                    >
                      {editNote && (
                        <IconButton
                          onClick={handleSaveNote}
                          color="success"
                          className="rounded-full border border-green-500 bg-green-50/50"
                          disabled={updateNoteMutation.isPending || !editNote}
                        >
                          <CheckIcon />
                        </IconButton>
                      )}
                      <IconButton
                        onClick={() => {
                          setEditNote(!editNote);
                          note !== (employee?.note ?? '') &&
                            setNote(employee?.note ?? '');
                        }}
                        color={!editNote ? 'primary' : 'inherit'}
                        className={`rounded-lg border ${editNote ? 'border-red-500 bg-red-50/50' : 'border-blue-500'}`}
                      >
                        {editNote ? (
                          <CloseIcon className="text-red-400" />
                        ) : (
                          <EditNoteIcon />
                        )}
                      </IconButton>
                    </Stack>
                  </Stack>
                  <TextField
                    variant="outlined"
                    className={`bg-white ${editNote ? '' : 'bg-gray-100! opacity-50'}`}
                    fullWidth
                    multiline
                    rows={5}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    error={updateNoteMutation.isError}
                    slotProps={{
                      input: {
                        readOnly: updateNoteMutation.isPending || !editNote,
                      },
                    }}
                    helperText={
                      updateNoteMutation.isError
                        ? 'Nie udało się zapisać notatki.'
                        : ''
                    }
                    sx={{ '& .MuiOutlinedInput-root': { p: 1.5 } }}
                  />
                </Stack>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }} sx={{ flexGrow: 1 }}>
              <Grid className="border-lightGray mb-3 rounded-lg border bg-white p-3 md:p-5">
                <Stack direction="row" justifyContent="space-between" mb={3}>
                  <Typography
                    variant="subtitle1"
                    className="text-lg font-semibold"
                  >
                    Umowa zatrudnienia
                  </Typography>
                </Stack>

                <AttachmentBox
                  file={employee.contractAttachment}
                  onShow={() => handleOpenPreview(employee.contractAttachment)}
                  onDownload={() =>
                    handleDownloadAttachment(employee.contractAttachment)
                  }
                />

                <Grid container spacing={2}>
                  {contractFields.map(({ key, label }) => {
                    return generateDateBox(key, label, employee);
                  })}
                </Grid>
              </Grid>
              <Grid className="border-lightGray rounded-lg border bg-white p-3 md:p-5">
                <Stack direction="row" justifyContent="space-between" mb={3}>
                  <Typography
                    variant="subtitle1"
                    className="text-lg font-semibold"
                  >
                    Umowa A1
                  </Typography>
                </Stack>
                <AttachmentBox
                  file={employee.a1Attachment}
                  onShow={() => handleOpenPreview(employee.a1Attachment)}
                  onDownload={() =>
                    handleDownloadAttachment(employee.a1Attachment)
                  }
                />
                <Grid container spacing={2}>
                  {a1Fields.map(({ key, label }) => {
                    return generateDateBox(key, label, employee);
                  })}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}
        {/* <Dialog
          open={endDialogOpen}
          onClose={closeEndDialog}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Zakończ budowę
              </Typography>
              <IconButton aria-label="close" onClick={closeEndDialog}>
                <CloseIcon />
              </IconButton> 
            </Stack>
          </DialogTitle>
          <DialogContent dividers sx={{ pb: 4 }}>
            <Stack spacing={2}>
              <Typography variant="body2">
                Wybierz datę zakończenia budowy.
              </Typography>
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="pl"
              >
                <DatePicker
                  label="Data zakończenia"
                  value={endDateValue}
                  onChange={(v) => {
                    setEndDateError(null);
                    setEndDateValue(v ?? dayjs());
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!endDateError,
                      helperText: endDateError ?? '',
                    },
                    field: { clearable: false },
                  }}
                />
              </LocalizationProvider> 
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              variant="contained"
              // onClick={handleFinish}
              // disabled={updateStatusMutation.isPending}
            >
              Zapisz
            </Button>
          </DialogActions>
        </Dialog> */}
      </Box>
    ) : null;
  }, [
    isLoading,
    error,
    employee,
    tab,
    handleBack,
    handleEmployeeEdit,
    showDebug,
    note,
    updateNoteMutation.isPending,
    updateNoteMutation.isError,
    handleSaveNote,
    editNote,
    notFound,
    handleOpenPreview,
  ]);

  const pageTitle = employee?.name || 'Szczegóły Pracownika';

  return (
    <PageContainer
      title={`Pracownik ${pageTitle}`}
      breadcrumbs={[
        { title: 'Pracownicy', path: '/employees' },
        { title: pageTitle },
      ]}
      actions={
        <Stack direction="row" alignItems="center">
          {!error && !notFound ? (
            isLoading ? (
              <CircularProgress size={24} />
            ) : (
              <Chip
                label={employee?.status ? 'Zatrudniony' : 'Niezatrudniony'}
                className={
                  employee?.status
                    ? 'bg-green-300/50 text-green-600'
                    : 'bg-red-300/50 text-red-600'
                }
                variant="filled"
                sx={{
                  borderRadius: 1,
                  p: 0.5,
                  ml: 2,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              />
            )
          ) : null}
        </Stack>
      }
    >
      <Box sx={{ display: 'flex', flex: 1, width: '100%' }}>{renderShow}</Box>
      <PreviewDialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={previewFile}
      />
    </PageContainer>
  );
}
