import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router';

import PageContainer from '../../../components/PageContainer';
import Loading from '../../../shared/ui/Loading';


import {
  getConstruction,
  updateConstruction,
} from '../../../api/constructions';

import EditIcon from '@mui/icons-material/Edit';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import {
  alpha,
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
  Tooltip,
} from '@mui/material';
import { useParams } from 'react-router';
import dayjs from 'dayjs';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useNotifications from '../../../shared/ui/notifications/useNotifications';
import { getEmployeesByScheduledConstruction } from '../../../api/schedules';
import FileBrowser from '../../file-browser/components/FileBrowser';
import useLoading from '../../../shared/hooks/useLoading';
import { Note } from '../../../shared/ui/Note';

import PeopleIcon from '@mui/icons-material/People';
import { FinishConstruction, ResumeConstruction } from './ConstructionDialogs';
import { EventsListTable } from '../../../components/EventsBox';
import { getUpcomingEventsForConstruction } from '../../calendar/api';
import { openGoogleMaps } from '../../../utils';
import type { Construction } from '../../../entities/constructions';
import { FOLDER_NAMES } from '../../../entities/files';

const personalFields = [
  { key: 'name', label: 'Nazwa budowy' },
  { key: 'location', label: 'Lokalizacja' },
  { key: 'contractorName', label: 'Wykonawca' },
  { key: 'startDate', label: 'Data rozpoczęcia' },
  { key: 'endDate', label: 'Data zakończenia' },
];

export default function ConstructionShow() {
  const { constructionId } = useParams<{ constructionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    // loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  const [notFound, setNotFound] = useState(false);
  const notifications = useNotifications();
  const [tab, setTab] = useState(0);

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
    queryKey: ['schedules', 'employeesByConstruction', constructionId],
    queryFn: () =>
      getEmployeesByScheduledConstruction([constructionId!], dayjs().toDate()),
    enabled: !!constructionId,
  });

  const { data: upcomingEvents = [], isLoading: isUpcomingEventsLoading } =
    useQuery({
      queryKey: ['calendarEvents', 'upcoming', 'construction', constructionId],
      queryFn: () => getUpcomingEventsForConstruction(constructionId ?? ''),
      enabled: !!constructionId,
    });

  useEffect(() => {
    if (construction) {
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

  const handleSaveNote = useCallback(
    async (note: string) => {
      startActionLoading();
      try {
        await updateNoteMutation.mutateAsync(note);
      } finally {
        stopActionLoading();
      }
    },
    [updateNoteMutation, startActionLoading, stopActionLoading]
  );

  const handleConstructionEdit = useCallback(() => {
    navigate(`/constructions/${constructionId}/edit`);
  }, [navigate, constructionId]);

  const handleBack = useCallback(() => {
    navigate('/constructions');
  }, [navigate]);

  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);

  const isInProgress = construction?.status ?? false;

  const openEndDialog = useCallback(() => {
    setEndDialogOpen(true);
  }, []);

  const closeEndDialog = useCallback(() => {
    setEndDialogOpen(false);
  }, []);

  const activeScheduleEmployees = useMemo(() => {
    if (scheduleEmployees) {
      return scheduleEmployees[0].employees?.filter((e) => e.status);
    } else {
      return [];
    }
  }, [scheduleEmployees]);

  const error = errorConstruction || errorScheduleEmployees;
  const loading =
    isLoadingConstruction ||
    isScheduleEmployeesLoading ||
    isUpcomingEventsLoading;

  const handleNavigateToContractor = useCallback(
    (id: string) => {
      if (!id) return;
      navigate(`/constructions?view=contractors&contractorId=${id}`);
    },
    [navigate]
  );

  const renderInfoCell = useCallback(
    (
      construction: Construction,
      key: string,
      value: string | boolean | Date | null | undefined
    ) => {
      if (!construction || !value) {
        return (
          <Typography
            fontWeight={'bold'}
            color="textSecondary"
            component={'span'}
          >
            -
          </Typography>
        );
      } else {
        if (key === 'location') {
          return (
            <Tooltip title="Otwórz w Google Maps">
              <Typography
                variant="body1"
                className="text-sm font-semibold sm:text-base"
                sx={{
                  display: 'inline-block',
                  cursor: construction?.location ? 'pointer' : 'default',
                  color: construction?.location ? 'location' : 'inherit',
                  ':hover': { textDecoration: 'underline' },
                }}
                onClick={() => openGoogleMaps(construction.location)}
              >
                {String(value)}{' '}
                <LocationOnIcon fontSize="small" sx={{ color: 'location' }} />
              </Typography>
            </Tooltip>
          );
        }

        if (key === 'contractorName') {
          return (
            <Tooltip title="Przejdź do wykonawcy">
              <Typography
                variant="body1"
                className="text-sm font-semibold sm:text-base"
                color="textPrimary"
                sx={{
                  display: 'inline-block',
                  cursor: construction?.location ? 'pointer' : 'default',
                  ':hover': { textDecoration: 'underline' },
                }}
                onClick={() =>
                  handleNavigateToContractor(construction.contractorId ?? '')
                }
              >
                {String(value)}
              </Typography>
            </Tooltip>
          );
        }

        if (
          (key === 'startDate' || key === 'endDate') &&
          value instanceof Date
        ) {
          return (
            <Typography
              variant="body1"
              className="text-sm font-semibold sm:text-base"
            >
              {dayjs(value).format('DD.MM.YYYY')}
            </Typography>
          );
        }

        return (
          <Typography
            variant="body1"
            className="text-sm font-semibold sm:text-base"
          >
            {String(value)}
          </Typography>
        );
      }
    },
    [handleNavigateToContractor]
  );

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
      tab === 0 ? (
        <Box
          sx={(theme) => ({
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          })}
          className="rounded-lg p-2 md:p-4 lg:p-6"
        >
          <Grid container spacing={{ xs: 2, lg: 3 }} columns={12} sx={{}}>
            <Grid size={{ xs: 12, lg: 6 }} sx={{ flexGrow: 1 }}>
              <Stack direction={'column'} spacing={{ xs: 2, lg: 3 }}>
                <TableContainer
                  component={Paper}
                  className="overflow-hidden rounded-lg"
                  sx={(theme) => ({
                    boxShadow: 'none',
                    border: `1px solid ${theme.palette.divider}`,
                  })}
                >
                  <Table>
                    <TableBody>
                      {personalFields.map(({ key, label }) => (
                        <TableRow
                          key={key}
                          sx={(theme) => ({
                            borderBottom: '1px solid',
                            borderColor: theme.palette.divider,
                            '&:last-child': {
                              borderBottom: 'none',
                            },
                          })}
                        >
                          <TableCell
                            sx={(theme) => ({
                              minWidth: { xs: '135px', sm: '150px' },
                              width: '30%',
                              border: 'none',
                              background: theme.palette.background.default,
                              borderRight: `1px solid ${theme.palette.divider}`,
                            })}
                            className="p-2 sm:px-4"
                          >
                            <Typography
                              variant="body1"
                              className="text-sm font-medium text-gray-500"
                            >
                              {label}:
                            </Typography>
                          </TableCell>

                          <TableCell
                            align="right"
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
                            {renderInfoCell(
                              construction,
                              key,
                              construction[key as keyof Construction]
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Note
                  content={construction?.note ?? ''}
                  onSave={handleSaveNote}
                  loading={updateNoteMutation.isPending}
                />
              </Stack>
            </Grid>

            <Grid
              container
              size={{ xs: 12, lg: 6 }}
              spacing={{ xs: 2, lg: 3 }}
              columns={12}
              alignContent={'flex-start'}
            >
              <Grid
                size={12}
                className="overflow-hidden rounded-lg"
                sx={(theme) => ({
                  alignSelf: 'flex-start',
                  border: `1px solid ${theme.palette.divider}`,
                })}
              >
                <table className="w-full">
                  <thead>
                    <TableRow
                      sx={(theme) => ({
                        background: theme.palette.accent.main,
                      })}
                    >
                      <th className="px-4 py-3 text-left">
                        <Stack
                          direction={'row'}
                          alignItems={'center'}
                          spacing={1}
                        >
                          <PeopleIcon sx={{ color: 'accent.superDark' }} />
                          <Typography variant="subtitle2" fontWeight="600">
                            Pracownicy na budowie dziś (
                            {activeScheduleEmployees?.length}):
                          </Typography>
                        </Stack>
                      </th>
                    </TableRow>
                  </thead>
                  <TableBody
                    sx={(theme) => ({
                      '& > tr:not(:last-child) > td, & > tr:not(:last-child) > th':
                        {
                          borderBottom: `1px solid ${theme.palette.divider}`,
                        },
                      '& > tr:last-child > td, & > tr:last-child > th': {
                        borderBottom: 'none',
                      },
                    })}
                  >
                    {activeScheduleEmployees &&
                    activeScheduleEmployees.length > 0 ? (
                      activeScheduleEmployees.map((employee) => {
                        return (
                          <TableRow
                            key={employee.id}
                            onClick={() =>
                              navigate(`/employees/${employee.id}`)
                            }
                            className="cursor-pointer transition-colors"
                            sx={(theme) => ({
                              ':hover': {
                                background: theme.palette.accent.light,
                              },
                              ':active': {
                                background: theme.palette.accent.main,
                              },
                            })}
                          >
                            <td className="px-4 py-3">
                              <Stack
                                direction={'row'}
                                alignItems={'center'}
                                spacing={1}
                              >
                                <Typography
                                  variant="body2"
                                  color="textSecondary"
                                  className="font-medium"
                                >
                                  {employee.name}
                                </Typography>
                                {employee.isContractor && (
                                  <Chip label={'Kontraktor'} size="small" />
                                )}
                              </Stack>
                            </td>
                          </TableRow>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="px-4 py-3">
                          <Typography variant="body2" color="textSecondary">
                            Brak pracowników na budowie
                          </Typography>
                        </td>
                      </tr>
                    )}
                  </TableBody>
                </table>
              </Grid>

              <Grid
                size={12}
                className="overflow-hidden rounded-lg"
                sx={(theme) => ({
                  alignSelf: 'flex-start',
                  border: `1px solid ${theme.palette.divider}`,
                })}
              >
                <EventsListTable type="construction" events={upcomingEvents} />
              </Grid>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <FileBrowser baseDirectory={`${FOLDER_NAMES['employees']}/${construction.id}`} />
      )
    ) : null;
  }, [
    loading,
    error,
    notFound,
    construction,
    tab,
    handleSaveNote,
    updateNoteMutation.isPending,
    handleBack,
    navigate,
    upcomingEvents,
    renderInfoCell,
    activeScheduleEmployees,
  ]);

  const pageTitle = construction?.name || '...';

  return (
    <PageContainer
      fixedHeight={loading || tab === 1}
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
                variant="filled"
                sx={(theme) => ({
                  borderRadius: 1,
                  p: 0.5,
                  ml: 2,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  color: isInProgress
                    ? theme.palette.status.construction.active.text
                    : theme.palette.status.construction.inactive.text,
                  background: isInProgress
                    ? theme.palette.status.construction.active.background
                    : theme.palette.status.construction.inactive.background,
                })}
              />
            )
          ) : null}
        </Stack>
      }
      renderTopToolbar={
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={(theme) => ({
            background: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
            pr: 2,
          })}
        >
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
            <Tooltip title="Edytuj budowę">
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
                  sx={(theme) => ({
                    border: `1px solid ${theme.palette.warning.main}`,
                    background: alpha(theme.palette.warning.main, 0.1),
                  })}
                  className="rounded-full"
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
                  className="rounded-full"
                  sx={(theme) => ({
                    border: `1px solid ${theme.palette.success.main}`,
                    background: alpha(theme.palette.success.main, 0.1),
                  })}
                >
                  <EventRepeatIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      }
    >
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          width: '100%',
          py: !error && tab === 0 ? 2 : 0,
          px: tab === 0 && !error ? { xs: 0.5, sm: 2 } : 0,
          height: tab === 0 ? 'auto' : '100%',
        }}
      >
        {renderShow}
        {construction && (
          <>
            <FinishConstruction
              open={endDialogOpen}
              onClose={closeEndDialog}
              construction={construction}
            />
            <ResumeConstruction
              open={resumeDialogOpen}
              onClose={() => setResumeDialogOpen(false)}
              construction={construction}
            />
          </>
        )}
      </Box>
    </PageContainer>
  );
}
