import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router';

import PageContainer from '../../../components/PageContainer';
import Loading from '../../../components/Loading';

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
  IconButton,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tabs,
  TextareaAutosize,
  Tooltip,
} from '@mui/material';
import { useParams } from 'react-router';
import dayjs from 'dayjs';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { getEmployeesByScheduledConstruction } from '../../../api/schedules';
import BaseDialog, { ConfirmationDialog } from '../../../components/BaseDialog';
import FirebaseFileBrowser from '../../../components/fileBrowser/FileBrowser';
import useLoading from '../../../hooks/useLoading';

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
  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  const [notFound, setNotFound] = useState(false);
  const [editNote, setEditNote] = useState(false);
  const notifications = useNotifications();
  const [tab, setTab] = useState(0);
  const [note, setNote] = useState('');

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

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
    data: scheduleEmployees,
    isLoading: isScheduleEmployeesLoading,
    error: errorScheduleEmployees,
  } = useQuery({
    queryKey: ['employeesByConstruction', constructionId],
    queryFn: () =>
      getEmployeesByScheduledConstruction(constructionId!, dayjs().toDate()),
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

  const handleCancelEdit = useCallback(() => {
    setEditNote(false);
    setNote(construction?.note ?? '');
  }, [construction?.note]);

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
    startActionLoading();
    try {
      await updateNoteMutation.mutateAsync(note);
      setEditNote(false);
    } finally {
      stopActionLoading();
    }
  }, [
    construction?.note,
    note,
    updateNoteMutation,
    startActionLoading,
    stopActionLoading,
  ]);

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

  const error = errorConstruction || errorScheduleEmployees;
  const loading = isLoadingConstruction || isScheduleEmployeesLoading;

  const renderShow = useMemo(() => {
    if (loading) {
      return <Loading message="Ładowanie danych budowy..." />;
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
            <Button variant="contained" onClick={handleBack} color="inherit">
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
          <Grid size={{ xs: 12, sm: 8 }} sx={{ width: '100%!important' }}>
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
                <Tooltip title="Edytuj pracownika">
                  <IconButton
                    onClick={handleConstructionEdit}
                    color="primary"
                    className="rounded-full border"
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                {isInProgress ? (
                  <Tooltip title="Zakończ budowę">
                    <IconButton
                      onClick={openEndDialog}
                      color="warning"
                      size="small"
                      className="rounded-full border border-amber-500 bg-amber-50/50"
                    >
                      <EventAvailableIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Wznów budowę">
                    <IconButton
                      onClick={() => setResumeDialogOpen(true)}
                      color="success"
                      size="small"
                      className="rounded-full border border-green-500 bg-green-50/50"
                    >
                      <EventRepeatIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          </Grid>
        </Grid>
        {tab === 0 && (
          <Grid container spacing={{ xs: 2 }} columns={12}>
            <Grid size={{ xs: 12, lg: 6 }} sx={{ flexGrow: 1 }}>
              <Stack direction={'column'} spacing={{ xs: 2, lg: 3 }}>
                <TableContainer
                  component={Paper}
                  className="border-lightGray overflow-hidden rounded-lg border"
                  sx={{ boxShadow: 'none' }}
                >
                  <Table>
                    <TableBody>
                      {personalFields.map(({ key, label }) => (
                        <TableRow
                          key={key}
                          sx={{
                            borderBottom: '1px solid',
                            borderColor: 'grey.300',
                            '&:last-child': {
                              borderBottom: 'none',
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              minWidth: { xs: '135px', sm: '150px' },
                              width: '30%',
                              border: 'none',
                            }}
                            className="border-r-lightGray border-r bg-gray-50 p-2 sm:px-4"
                          >
                            <Typography
                              variant="body1"
                              className="text-sm font-medium text-gray-500"
                            >
                              {label}:
                            </Typography>
                          </TableCell>

                          <TableCell
                            sx={{
                              border: 'none',
                              maxWidth: '100%',
                              overflow: 'visible',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              textAlign: 'right',
                            }}
                            className="p-2 sm:px-4"
                          >
                            {key === 'location' ? (
                              <Typography
                                variant="body1"
                                className="text-sm font-semibold sm:text-base"
                                sx={{
                                  cursor: construction?.location
                                    ? 'pointer'
                                    : 'default',
                                  color: construction?.location
                                    ? 'navy'
                                    : 'inherit',
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
                                      {String(value)}{' '}
                                      <LocationOnIcon fontSize="small" />
                                    </>
                                  );
                                })()}
                              </Typography>
                            ) : (
                              <Typography
                                variant="body1"
                                className="text-dark text-sm font-semibold sm:text-base"
                              >
                                {(() => {
                                  const value =
                                    construction[key as keyof Construction];
                                  if (!value && key !== 'inProgress') {
                                    return <em className="text-gray-400">-</em>;
                                  }
                                  if (
                                    key === 'startDate' ||
                                    key === 'endDate'
                                  ) {
                                    return dayjs(value).format('DD/MM/YYYY');
                                  }
                                  if (key === 'inProgress') {
                                    return value ? 'Tak' : 'Nie';
                                  }
                                  return String(value);
                                })()}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box className="rounded-lg border border-dashed border-gray-300 p-4">
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
                      <Typography
                        variant="body1"
                        className="font-medium"
                        sx={{
                          alignSelf: 'flex-start',
                        }}
                      >
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
                          <Tooltip title={'Zapisz notatkę'}>
                            <IconButton
                              size="small"
                              onClick={handleSaveNote}
                              color="success"
                              className="rounded-full border border-green-500 bg-green-50/50"
                              disabled={actionLoading || !editNote}
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={editNote ? 'Anuluj' : 'Edytuj notatkę'}>
                          <IconButton
                            size="small"
                            onClick={
                              editNote
                                ? handleCancelEdit
                                : () => setEditNote(true)
                            }
                            color={!editNote ? 'primary' : 'inherit'}
                            className={`rounded-lg border ${editNote ? 'border-red-500 bg-red-50/50' : ''}`}
                          >
                            {editNote ? (
                              <CloseIcon className="text-red-400" />
                            ) : (
                              <EditNoteIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                    <TextareaAutosize
                      minRows={3}
                      className={`rounded-sm border border-gray-300 bg-white px-2 py-1 ${editNote ? '' : 'bg-gray-50! opacity-75'}`}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                      }}
                      placeholder="..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      readOnly={actionLoading || !editNote}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Grid>

            <Grid
              size={{ xs: 12, lg: 6 }}
              className="border-lightGray overflow-hidden rounded-lg border"
              sx={{
                alignSelf: 'flex-start',
              }}
            >
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
                    scheduleEmployees.map((employee) => {
                      return (
                        <tr
                          key={employee.id}
                          onClick={() => navigate(`/employees/${employee.id}`)}
                          className="cursor-pointer transition-colors hover:bg-blue-50 active:bg-blue-100"
                        >
                          <td className="px-4 py-3">
                            <Typography
                              variant="body2"
                              className="text-gray-700"
                            >
                              {employee.name}
                            </Typography>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
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
          showCancel={false}
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
                    size: 'small',
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
          showCancel={false}
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
    actionLoading,
    note,
    scheduleEmployees,
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
              <Loading size={24} message="" />
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
