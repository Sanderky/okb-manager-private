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
  Divider,
  IconButton,
  Tab,
  Tabs,
  TextareaAutosize,
} from '@mui/material';
import { useParams } from 'react-router';
import dayjs from 'dayjs';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { getEmployeesByScheduledConstruction } from '../../../api/schedules';
import { getEmployeeList } from '../../../api/employees';
import BaseDialog, { ConfirmationDialog } from '../../../components/BaseDialog';
import FirebaseFileBrowser from '../../../components/fileBrowser/FileBrowser';

const personalFields = [
  { key: 'name', label: 'Nazwa budowy' },
  { key: 'location', label: 'Lokalizacja' },
  { key: 'contractor', label: 'Wykonawca' },
  { key: 'startDate', label: 'Data rozpoczęcia' },
  { key: 'endDate', label: 'Data zakończenia' },
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
      notifications.show('Notatka została zaktualizowana.', {
        severity: 'success',
        autoHideDuration: 5000,
      });
    },
    onError: (error: Error) => {
      console.error('Update note error:', error);
      notifications.show('Wystąpił błąd podczas zapisywania notatki.', {
        severity: 'error',
        autoHideDuration: 5000,
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
  }, [construction?.note, note, updateNoteMutation]);

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
      // Powiadomienia są wyświetlane w handleFinish i handleResume
    },
    onError: (error: Error) => {
      console.error('Update construction status error:', error);
      notifications.show('Wystąpił błąd podczas zmiany stanu budowy.', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    },
  });

  const isInProgress = !!construction && !construction.endDate;

  const openEndDialog = useCallback(() => {
    setEndDateError(null);
    setEndDateValue(dayjs());
    setEndDialogOpen(true);
  }, []);

  const closeEndDialog = useCallback(() => {
    setEndDialogOpen(false);
  }, []);

  const handleFinish = useCallback(() => {
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
            autoHideDuration: 5000,
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
            autoHideDuration: 5000,
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
          <Alert severity="error">
            Wystąpił błąd podczas ładowania danych budowy.
          </Alert>
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
        sx={{ width: '100%', boxShadow: 1 }}
        className="rounded-lg bg-white p-4 md:p-6 md:pt-4"
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
            <Grid size={{ xs: 12, lg: 6 }} sx={{ flexGrow: 1 }}>
              <Stack
                direction={'column'}
                spacing={2}
                className="border-lightGray overflow-hidden rounded-lg border p-4"
              >
                {personalFields.map(({ key, label }) => (
                  <Box
                    key={key}
                    className="border-b border-gray-300 pb-3 last:border-b-0 last:pb-1"
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
                  </Box>
                ))}
              </Stack>
              <Box className="mt-6 rounded-lg border border-dashed border-gray-300 p-4">
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
                </Stack>
              </Box>
            </Grid>

            <Grid
              size={{ xs: 12, lg: 6 }}
              className="border-lightGray overflow-hidden rounded-lg border"
              sx={{
                alignSelf: 'flex-start',
              }}
            >
              {employees && (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left">
                        <Typography variant="subtitle2" fontWeight="600">
                          Pracownicy na budowie ({scheduleEmployees?.length}):
                        </Typography>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {scheduleEmployees &&
                      employees
                        .filter((e) => scheduleEmployees.includes(e.id))
                        .map((emp) => (
                          <tr
                            key={emp.id}
                            onClick={() => navigate(`/employees/${emp.id}`)}
                            className="cursor-pointer transition-colors hover:bg-blue-50 active:bg-blue-100"
                          >
                            <td className="px-4 py-3">
                              <Typography
                                variant="body2"
                                className="text-gray-700"
                              >
                                {emp.name}
                              </Typography>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              )}
            </Grid>
          </Grid>
        )}
        {tab === 1 && (
          <Box>
            <FirebaseFileBrowser
              baseDirectory={`constructions/${construction.id}/files`}
            />
          </Box>
        )}
        <BaseDialog
          open={endDialogOpen}
          onClose={closeEndDialog}
          onConfirm={handleFinish}
          title="Zakończ budowę"
          confirmText="Zakończ budowę"
          confirmColor="warning"
          cancelText="Anuluj"
          showCloseButton={false}
          loading={updateStatusMutation.isPending}
        >
          <Stack spacing={3}>
            <Typography variant="body1">
              Wybierz datę zakończenia budowy{' '}
              <strong>{construction?.name}</strong>:
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
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
        </BaseDialog>
        <ConfirmationDialog
          open={resumeDialogOpen}
          onClose={() => setResumeDialogOpen(false)}
          onConfirm={handleResume}
          title="Wznawianie budowy"
          message={
            <Typography variant="body1">
              Czy na pewno chcesz wznowić budowę{' '}
              <strong>{construction?.name}</strong>?
            </Typography>
          }
          confirmText="Wznów budowę"
          cancelText="Anuluj"
          confirmColor="success"
          loading={updateStatusMutation.isPending}
        />
      </Box>
    ) : null;
  }, [
    loading,
    error,
    notFound,
    construction,
    tab,
    handleConstructionEdit,
    isInProgress,
    openEndDialog,
    editNote,
    handleSaveNote,
    updateNoteMutation.isPending,
    note,
    scheduleEmployees,
    employees,
    endDialogOpen,
    closeEndDialog,
    handleFinish,
    updateStatusMutation.isPending,
    endDateValue,
    endDateError,
    resumeDialogOpen,
    handleResume,
    handleBack,
    navigate,
  ]);

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
