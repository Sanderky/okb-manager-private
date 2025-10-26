import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router';

import PageContainer from '../../../components/PageContainer';

import { type Construction } from '../../../types';
import {
  getConstruction,
  updateConstruction,
} from '../../../api/constructions';

import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CheckIcon from '@mui/icons-material/Check';
import LocationOnIcon from '@mui/icons-material/LocationOn';

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
  TextareaAutosize,
  TextField,
} from '@mui/material';
import { useParams } from 'react-router';
import dayjs from 'dayjs';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { getEmployeesByScheduledConstruction } from '../../../api/schedules';
import { getEmployeeList } from '../../../api/employees';

const personalFields = [
  { key: 'name', label: 'Nazwa budowy' },
  { key: 'location', label: 'Lokalizacja' },
  { key: 'contractor', label: 'Wykonawca' },
  { key: 'startDate', label: 'Data rozpoczęcia' },
  { key: 'endDate', label: 'Data zakończenia' },
  // { key: 'inProgress', label: 'W trakcie realizacji' },
];

export default function ConstructionShow() {
  const { constructionId } = useParams<{ constructionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notFound, setNotFound] = useState(false);

  const [editNote, setEditNote] = useState(false);

  const notifications = useNotifications();

  const [tab, setTab] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  // const [employee, setEmployee] = useState<Employee | null>(null);

  const [note, setNote] = useState('');

  const {
    data: construction,
    isLoading: isLoadingConstruction,
    error: errorConstruction,
  } = useQuery({
    queryKey: ['construction', constructionId],
    queryFn: () => getConstruction(constructionId!),
    enabled: !!constructionId,
  });

  const {
    data: employees,
    isLoading: isLoadingEmployees,
    error: errorEmployees,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
  });

  const {
    data: scheduleEmployees,
    isLoading: isScheduleEmployeesLoading,
    error: errorScheduleEmployees,
  } = useQuery({
    queryKey: ['employeesByConstruction', constructionId],
    queryFn: () => getEmployeesByScheduledConstruction(constructionId!),
    enabled: !!constructionId,
  });

  useEffect(() => {
    if (construction) {
      setNote(construction.note ?? '');
      setNotFound(false);
    } else if (!isLoadingConstruction) {
      setNotFound(true);
    }
  }, [construction, isLoadingConstruction]);

  const updateNoteMutation = useMutation({
    mutationFn: (newNote: string) =>
      updateConstruction(constructionId!, { note: newNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['construction', constructionId],
      });
    },
  });

  const handleSaveNote = useCallback(async () => {
    const currentNote = construction?.note ?? '';
    if (currentNote === note) {
      return;
    }
    updateNoteMutation.mutate(note);
    setEditNote(false);
    notifications.show('Pomyślnie zaktualizowano notatkę.', {
      severity: 'success',
      autoHideDuration: 3000,
    });
  }, [construction?.note, note, updateNoteMutation, notifications]);

  const handleConstructionEdit = useCallback(() => {
    navigate(`/constructions/${constructionId}/edit`);
  }, [navigate, constructionId]);

  const handleBack = useCallback(() => {
    navigate('/constructions');
  }, [navigate]);

  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [endDateValue, setEndDateValue] = useState(dayjs());
  const [endDateError, setEndDateError] = useState<string | null>(null);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { endDate: Date | null }) =>
      updateConstruction(constructionId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['construction', constructionId],
      });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
    },
    onError: (error: Error) => {
      notifications.show(`Błąd zapisu: ${error.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
    },
  });

  const isInProgress = !!construction && !construction.endDate;

  const openEndDialog = useCallback(() => {
    setEndDateError(null);
    setEndDateValue(dayjs()); // domyślnie dziś
    setEndDialogOpen(true);
  }, []);

  const closeEndDialog = useCallback(() => {
    setEndDialogOpen(false);
  }, []);

  const handleFinish = useCallback(() => {
    // Walidacja: data zakończenia nie może być wcześniejsza niż startDate
    const start = construction?.startDate
      ? dayjs(construction.startDate).startOf('day')
      : null;
    const chosen = endDateValue ? endDateValue.endOf('day') : null;

    if (start && chosen && chosen.isBefore(start)) {
      setEndDateError(
        'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.'
      );
      return;
    }

    closeEndDialog();
    updateStatusMutation.mutate(
      { endDate: chosen ? chosen.toDate() : null },
      {
        onSuccess: () => {
          notifications.show('Budowa została oznaczona jako zakończona.', {
            severity: 'success',
            autoHideDuration: 3000,
          });
        },
      }
    );
  }, [
    construction?.startDate,
    endDateValue,
    closeEndDialog,
    updateStatusMutation,
    notifications,
  ]);

  const handleResume = useCallback(() => {
    setResumeDialogOpen(false);
    updateStatusMutation.mutate(
      { endDate: null },
      {
        onSuccess: () => {
          notifications.show('Budowa została wznowiona.', {
            severity: 'success',
            autoHideDuration: 3000,
          });
        },
      }
    );
  }, [updateStatusMutation, notifications]);

  const error = errorConstruction || errorEmployees || errorScheduleEmployees;
  const loading =
    isLoadingConstruction || isLoadingEmployees || isScheduleEmployeesLoading;

  const renderShow = useMemo(() => {
    if (loading) {
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
            Ładowanie danych budowy…
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
            Nie znaleziono budowy. Mogła zostać usunięta lub nie istnieje.
          </Alert>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleBack}>
              Wróć
            </Button>
          </Stack>
        </Box>
      );
    }

    return construction ? (
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
                  onClick={handleConstructionEdit}
                  color="primary"
                  className="rounded-full border border-blue-300"
                >
                  <EditIcon />
                </IconButton>
                {isInProgress ? (
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
                    onClick={() => setResumeDialogOpen(true)}
                    color="success"
                    className="rounded-full border border-green-500 bg-green-50/50"
                    title="Wznów budowę"
                  >
                    <EventRepeatIcon />
                  </IconButton>
                )}
              </Stack>
            </Stack>
          </Grid>
        </Grid>
        {tab === 0 && (
          <Grid container spacing={{ xs: 2 }} columns={12}>
            <Grid
              size={{ xs: 12, lg: 6 }}
              sx={{ flexGrow: 1 }}
              // className="border-lightGray border bg-white p-3 md:p-5"
            >
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
                      {key === 'location' ? (
                        <Typography
                          variant="body1"
                          sx={{
                            maxWidth: '100%',
                            overflow: 'visible',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            fontWeight: 600,
                            cursor: construction?.location
                              ? 'pointer'
                              : 'default',
                            color: construction?.location ? 'navy' : 'inherit',
                          }}
                          onClick={() => {
                            if (construction?.location) {
                              const address = encodeURIComponent(
                                construction.location
                              );
                              window.open(
                                `https://www.google.com/maps/search/?api=1&query=${address}`,
                                '_blank'
                              );
                            }
                          }}
                        >
                          {(() => {
                            const value =
                              construction[key as keyof Construction];
                            if (!value) {
                              return <em className="text-gray-400">-</em>;
                            }
                            return (
                              <>
                                {String(value)} {<LocationOnIcon />}
                              </>
                            );
                          })()}
                        </Typography>
                      ) : (
                        <Typography
                          variant="body1"
                          className="text-dark font-semibold"
                          sx={{
                            maxWidth: '100%',
                            overflow: 'visible',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                          }}
                          // noWrap
                        >
                          {(() => {
                            const value =
                              construction[key as keyof Construction];
                            if (!value && key !== 'inProgress') {
                              return <em className="text-gray-400">-</em>;
                            }
                            if (key === 'startDate' || key === 'endDate') {
                              return dayjs(value).format('DD/MM/YYYY');
                            }
                            if (key === 'inProgress') {
                              return value ? 'Tak' : 'Nie';
                            }
                            return String(value);
                          })()}
                        </Typography>
                      )}
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
                          if (note !== (construction?.note ?? '')) {
                            setNote(construction?.note ?? '');
                          }
                        }}
                        color={!editNote ? 'primary' : 'inherit'}
                        className={`rounded-lg border ${
                          editNote
                            ? 'border-red-500 bg-red-50/50'
                            : 'border-blue-500'
                        }`}
                      >
                        {editNote ? (
                          <CloseIcon className="text-red-400" />
                        ) : (
                          <EditNoteIcon />
                        )}
                      </IconButton>
                    </Stack>
                  </Stack>
                  <TextareaAutosize
                    minRows={3}
                    className={`rounded-sm border border-gray-400 bg-white px-2 py-1 ${editNote ? '' : 'bg-gray-100! opacity-50'}`}
                    style={{ width: '100%', minHeight: '50px' }}
                    placeholder="..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    readOnly={updateNoteMutation.isPending || !editNote}
                  />
                  {/* <TextField
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
                  /> */}
                </Stack>
              </Box>
            </Grid>
            {scheduleEmployees && scheduleEmployees?.length > 0 && (
              <Grid
                size={{ xs: 12, lg: 6 }}
                sx={{ flexGrow: 1 }}
                className="border-lightGray rounded-lg border bg-white p-3 md:p-5"
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={'600'}
                  sx={{
                    mb: 1,
                  }}
                >
                  Pracownicy na budowie:
                </Typography>
                {employees && (
                  <Stack
                    direction={'column'}
                    className="border-t border-t-gray-400"
                  >
                    {employees
                      .filter((e) => scheduleEmployees.includes(e.id))
                      .map((emp) => (
                        <>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              py: 1,
                              fontWeight: '450',
                            }}
                            className="text-gray-700"
                          >
                            {emp.name}
                          </Typography>
                          <Divider
                            orientation="horizontal"
                            flexItem
                            className="last:hidden"
                          />
                        </>
                      ))}
                  </Stack>
                )}
              </Grid>
            )}
            {/* <Divider sx={{ width: '100%' }} orientation="vertical" /> */}
          </Grid>
        )}
        <Dialog
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
              onClick={handleFinish}
              disabled={updateStatusMutation.isPending}
            >
              Zapisz
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={resumeDialogOpen}
          onClose={() => setResumeDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Wznawianie budowy
              </Typography>
              <IconButton
                aria-label="close"
                onClick={() => setResumeDialogOpen(false)}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="subtitle1">
              Czy na pewno chcesz wznowić budowę <b>{construction.name}</b> ?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setResumeDialogOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              Anuluj
            </Button>
            <Button
              variant="contained"
              onClick={handleResume}
              disabled={updateStatusMutation.isPending}
              color="success"
            >
              Potwierdź
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    ) : null;
  }, [loading, error, notFound, construction, tab, handleConstructionEdit, isInProgress, openEndDialog, editNote, handleSaveNote, updateNoteMutation.isPending, note, scheduleEmployees, employees, endDialogOpen, closeEndDialog, endDateValue, endDateError, handleFinish, updateStatusMutation.isPending, resumeDialogOpen, handleResume, handleBack]);

  const pageTitle = construction?.name || '...';

  return (
    <PageContainer
      title={`Budowa ${pageTitle}`}
      breadcrumbs={[
        { title: 'Budowy', path: '/constructions' },
        { title: pageTitle },
      ]}
      actions={
        <Stack direction="row" alignItems="center">
          {!error && !notFound ? (
            loading ? (
              <CircularProgress size={24} />
            ) : (
              <Chip
                label={isInProgress ? 'W trakcie' : 'Zakończona'}
                className={
                  isInProgress
                    ? 'bg-blue-300/50 text-blue-600'
                    : 'bg-amber-300/50 text-amber-600'
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
    </PageContainer>
  );
}
