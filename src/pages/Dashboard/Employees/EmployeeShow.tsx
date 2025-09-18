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

import { type Employee } from '../../../types';
import { getEmployee, updateEmployee } from '../../../api/employees';

import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';

import {
  Chip,
  Divider,
  IconButton,
  Switch,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import { useParams } from 'react-router';
import dayjs from 'dayjs';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useNotifications from '../../../hooks/useNotifications/useNotifications';

// Extended async status & helpers
interface NormalizedError {
  message: string;
  code?: string;
  raw?: unknown;
}

function normalizeError(err: unknown): NormalizedError {
  if (err instanceof Error) {
    const anyErr = err as any;
    const code = typeof anyErr.code === 'string' ? anyErr.code : undefined;
    return { message: err.message || 'Wystąpił nieznany błąd', code, raw: err };
  }
  return { message: 'Wystąpił nieznany błąd', raw: err };
}

export default function EmployeeShow() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notFound, setNotFound] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const [editNote, setEditNote] = useState(false);

  const notifications = useNotifications();

  // const [employee, setEmployee] = useState<Employee | null>(null);
  const [note, setNote] = useState('');
  const [tab, setTab] = useState(0);

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

  useEffect(() => {
    if (employee) {
      setNote(employee.note ?? '');
      setNotFound(false);
    } else if (!isLoading) {
      setNotFound(true);
    }
  }, [employee, isLoading]);

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
            Ładowanie danych pracownika…
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ flexGrow: 1, width: '100%' }}>
          <Alert
            severity="error"
            action={
              <Stack direction="row" spacing={1}>
                {/* <Button size="small" onClick={handleRetry} variant="outlined">
                  Ponów
                </Button> */}
                <Button
                  size="small"
                  onClick={() => setShowDebug((v) => !v)}
                  variant="text"
                >
                  {showDebug ? 'Ukryj' : 'Szczegóły'}
                </Button>
              </Stack>
            }
          >
            {/* {error.code
              ? `${error.message} (kod: ${error.code})`
              : error.message} */}
          </Alert>
          {showDebug && (
            <Paper sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }} variant="outlined">
              <Typography
                variant="caption"
                component="pre"
                sx={{ m: 0, whiteSpace: 'pre-wrap' }}
              >
                {/* {JSON.stringify(error.raw, null, 2)} */}
              </Typography>
            </Paper>
          )}
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
        className="border-lightGray rounded-lg border bg-white p-4 md:px-6 md:py-4"
      >
        <Grid
          container
          spacing={2}
          alignItems={'center'}
          columns={12}
          sx={{ mb: 2 }}
        >
          <Grid size={{ xs: 12, sm: 8 }}>
            <Tabs
              value={tab}
              onChange={handleTabChange}
              aria-label="Zakładki pracownika"
            >
              <Tab label="Informacje" />
              <Tab label="Pliki" />
            </Tabs>
          </Grid>
          <Grid
            container
            sx={{ justifyContent: 'flex-end' }}
            width={'100%'}
            size={{ xs: 12, sm: 4 }}
          >
            {tab === 0 && (
              <Chip
                label={employee?.status ? 'Zatrudniony' : 'Niezatrudniony'}
                className={
                  employee?.status ? 'bg-green-400/50' : 'bg-red-400/50'
                }
                variant="filled"
              />
            )}
          </Grid>
        </Grid>
        {tab === 0 && (
          <Grid container spacing={2} columns={12}>
            <Grid
              size={{ xs: 12, md: 7 }}
              className="border-lightGray rounded-lg border bg-white p-3 md:p-5"
              sx={{ flexGrow: 1 }}
            >
              <Stack direction="row" justifyContent="space-between" mb={3}>
                <Typography
                  variant="subtitle1"
                  className="text-lg font-semibold"
                >
                  Informacje osobiste
                </Typography>
                {/* <Chip
                  label={employee?.status ? 'Zatrudniony' : 'Niezatrudniony'}
                  color={employee?.status ? 'success' : 'error'}
                  variant="filled"
                  className="-mt-7 sm:mt-0"
                /> */}
              </Stack>
              <Grid container spacing={2}>
                {personalFields.map(({ key, label }) => (
                  <Grid key={key} size={{ xs: 12 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body1" className="font-medium">
                        {label}:
                      </Typography>
                      <Typography
                        variant="body1"
                        className="border-lightGray rounded border px-3 py-1 text-gray-700"
                        sx={{
                          maxWidth: '100%',
                          overflow: 'visible',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                        }}
                      >
                        {(() => {
                          const value = employee[key as keyof Employee];
                          if (!value) {
                            return <em className="text-gray-400">Brak</em>;
                          }
                          return String(value);
                        })() || <em className="text-gray-400">Brak</em>}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid container spacing={2} size={{ xs: 12, md: 5 }}>
              <Grid
                size={{ xs: 12 }}
                className="border-lightGray rounded-lg border bg-white p-3 md:p-5"
              >
                <Stack direction="row" justifyContent="space-between" mb={3}>
                  <Typography
                    variant="subtitle1"
                    className="text-lg font-semibold"
                  >
                    Akcje
                  </Typography>
                </Stack>
                <Grid container spacing={3}>
                  <Box sx={{ width: '100%' }}>
                    <Stack
                      direction={{ xs: 'column', lg: 'row' }}
                      justifyContent={{ xs: 'flex-start', lg: 'space-between' }}
                      alignItems={{ xs: 'flex-start', lg: 'center' }}
                      sx={{ width: '100%' }}
                      spacing={{ xs: 1, lg: 2 }}
                    >
                      <div>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Edytuj pracownika
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: 'text.secondary' }}
                        >
                          Zmiana danych pracownika
                        </Typography>
                      </div>
                      <Button
                        variant="contained"
                        onClick={handleEmployeeEdit}
                        startIcon={<EditIcon />}
                        sx={{ minWidth: 120 }}
                      >
                        Edytuj
                      </Button>
                    </Stack>
                    <Divider className="my-5" />
                  </Box>
                </Grid>
              </Grid>
            </Grid>
            <Grid
              size={{ xs: 12 }}
              className="rounded-lg border border-dashed border-gray-300 p-4"
            >
              <Typography variant="body1" className="mb-2 font-medium">
                Notatka:
              </Typography>
              <Stack
                spacing={1.5}
                direction={'column'}
                alignItems={'flex-start'}
              >
                <TextField
                  variant="outlined"
                  className={`bg-white ${editNote ? '' : 'bg-gray-50! opacity-70'}`}
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
                />
                <Stack direction="row" spacing={2}>
                  <IconButton
                    onClick={() => {
                      setEditNote(!editNote);
                      note !== (employee?.note ?? '') &&
                        setNote(employee?.note ?? '');
                    }}
                    color={!editNote ? 'primary' : 'inherit'}
                    className="rounded-lg border border-gray-300"
                  >
                    {editNote ? (
                      <CloseIcon className="text-gray-500" />
                    ) : (
                      <EditIcon />
                    )}
                  </IconButton>
                  {editNote && (
                    <Button
                      variant="contained"
                      onClick={handleSaveNote}
                      disabled={updateNoteMutation.isPending || !editNote}
                    >
                      {updateNoteMutation.isPending
                        ? 'Zapisywanie...'
                        : 'Zapisz'}
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Grid>
            <Grid
              size={{ xs: 12, md: 6 }}
              className="border-lightGray rounded-lg border bg-white p-3 md:p-5"
              sx={{ flexGrow: 1 }}
            >
              <Stack direction="row" justifyContent="space-between" mb={3}>
                <Typography
                  variant="subtitle1"
                  className="text-lg font-semibold"
                >
                  Umowa zatrudnienia
                </Typography>
              </Stack>
              <Grid container spacing={2}>
                {contractFields.map(({ key, label }) => {
                  const endDate = dayjs(employee.contractEndDate?.date);
                  const today = dayjs();
                  const daysDiff = endDate.diff(today, 'day');
                  const isEndDateField = key === 'contractEndDate';
                  let dateStyles = '';
                  let severity: 'error' | 'warning' = 'warning';
                  let message = '';
                  let dayWord = 'dni';
                  const isPermanent = employee.contractEndDate?.permanent;
                  if (Math.abs(daysDiff) === 1) {
                    dayWord = 'dzień';
                  }

                  if (daysDiff <= 14 && isEndDateField) {
                    dateStyles =
                      'border-red-500/25! bg-red-600/10! text-red-800!';
                    severity = 'error';
                    if (daysDiff < 0) {
                      message = `Umowa wygasła ${Math.abs(
                        daysDiff
                      )} ${dayWord} temu`;
                    } else {
                      message = `Umowa kończy się za ${daysDiff} ${dayWord}`;
                    }
                  } else if (daysDiff <= 30 && isEndDateField) {
                    dateStyles =
                      'border-amber-500/25! bg-amber-500/10! text-amber-600!';
                    severity = 'warning';
                    message = `Umowa kończy się za ${daysDiff} ${dayWord}`;
                  }
                  const value = employee[key as keyof Employee];
                  let returnValue = null;
                  if (!value) {
                    returnValue = <em className="text-gray-400">Brak</em>;
                  } else {
                    if (isEndDateField) {
                      if (employee.contractEndDate?.permanent) {
                        returnValue = 'Na czas nieokreślony';
                      } else if (employee.contractEndDate?.date) {
                        returnValue = dayjs(
                          employee.contractEndDate?.date
                        ).format('DD/MM/YYYY');
                      }
                    } else {
                      returnValue = dayjs(value as Date).format('DD/MM/YYYY');
                    }
                  }
                  return (
                    <Grid key={key} size={{ xs: 12 }}>
                      <Stack
                        direction={{ xs: 'column', lg: 'row' }}
                        justifyContent={'flex-start'}
                        alignItems={{ xs: 'flex-start', lg: 'center' }}
                        sx={{ width: '100%' }}
                        spacing={{ xs: 1, lg: 2 }}
                      >
                        <Typography variant="body1" className="font-medium">
                          {label}:
                        </Typography>
                        <Typography
                          variant="body1"
                          className={`border-lightGray rounded border px-3 py-1 text-gray-700 ${dateStyles}`}
                        >
                          {returnValue}
                        </Typography>
                      </Stack>
                      {isEndDateField &&
                        !isPermanent &&
                        (() => {
                          return (
                            <Alert
                              severity={severity}
                              sx={{ width: '100%', mt: 2 }}
                            >
                              <Typography variant="body2">{message}</Typography>
                            </Alert>
                          );
                        })()}
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
            <Grid
              size={{ xs: 12, md: 6 }}
              className="border-lightGray rounded-lg border bg-white p-3 md:p-5"
              sx={{ flexGrow: 1 }}
            >
              <Stack direction="row" justifyContent="space-between" mb={3}>
                <Typography
                  variant="subtitle1"
                  className="text-lg font-semibold"
                >
                  Umowa A1
                </Typography>
              </Stack>
              <Grid container spacing={2}>
                {a1Fields.map(({ key, label }) => {
                  const endDate = dayjs(employee.a1EndDate?.date);
                  const today = dayjs();
                  const daysDiff = endDate.diff(today, 'day');
                  const isEndDateField = key === 'a1EndDate';
                  let dateStyles = '';
                  let severity: 'error' | 'warning' = 'warning';
                  let message = '';
                  let dayWord = 'dni';
                  const isPermanent = employee.a1EndDate?.permanent;
                  if (Math.abs(daysDiff) === 1) {
                    dayWord = 'dzień';
                  }

                  if (daysDiff <= 14 && isEndDateField) {
                    dateStyles =
                      'border-red-500/25! bg-red-600/10! text-red-800!';
                    severity = 'error';
                    if (daysDiff < 0) {
                      message = `Umowa wygasła ${Math.abs(
                        daysDiff
                      )} ${dayWord} temu`;
                    } else {
                      message = `Umowa kończy się za ${daysDiff} ${dayWord}`;
                    }
                  } else if (daysDiff <= 30 && isEndDateField) {
                    dateStyles =
                      'border-amber-500/25! bg-amber-500/10! text-amber-600!';
                    severity = 'warning';
                    message = `Umowa kończy się za ${daysDiff} ${dayWord}`;
                  }
                  const value = employee[key as keyof Employee];
                  let returnValue = null;
                  if (!value) {
                    returnValue = <em className="text-gray-400">Brak</em>;
                  } else {
                    if (isEndDateField) {
                      if (employee.a1EndDate?.permanent) {
                        returnValue = 'Na czas nieokreślony';
                      } else if (employee.a1EndDate?.date) {
                        returnValue = dayjs(employee.a1EndDate?.date).format(
                          'DD/MM/YYYY'
                        );
                      }
                    } else {
                      returnValue = dayjs(value as Date).format('DD/MM/YYYY');
                    }
                  }
                  return (
                    <Grid key={key} size={{ xs: 12 }}>
                      <Stack
                        direction={{ xs: 'column', lg: 'row' }}
                        justifyContent={'flex-start'}
                        alignItems={{ xs: 'flex-start', lg: 'center' }}
                        sx={{ width: '100%' }}
                        spacing={{ xs: 1, lg: 2 }}
                      >
                        <Typography variant="body1" className="font-medium">
                          {label}:
                        </Typography>
                        <Typography
                          variant="body1"
                          className={`border-lightGray rounded border px-3 py-1 text-gray-700 ${dateStyles}`}
                        >
                          {returnValue}
                        </Typography>
                      </Stack>
                      {isEndDateField &&
                        !isPermanent &&
                        (() => {
                          return (
                            <Alert
                              severity={severity}
                              sx={{ width: '100%', mt: 2 }}
                            >
                              <Typography variant="body2">{message}</Typography>
                            </Alert>
                          );
                        })()}
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          </Grid>
        )}
      </Box>
    ) : null;
  }, [
    isLoading,
    error,
    employee,
    tab,
    handleBack,
    handleEmployeeEdit,
    handleTabChange,
    personalFields,
    showDebug,
    note,
    updateNoteMutation.isPending,
    updateNoteMutation.isError,
    handleSaveNote,
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
        <Stack direction="row" alignItems="center" spacing={3}>
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Powrót
            <Box
              component="span"
              sx={{ display: { xs: 'none', md: 'inline' } }}
            >
              &nbsp;do listy
            </Box>
          </Button>
        </Stack>
      }
    >
      <Box sx={{ display: 'flex', flex: 1, width: '100%' }}>{renderShow}</Box>
    </PageContainer>
  );
}
