import {
  Card,
  Typography,
  Stack,
  Box,
  List,
  ListItem,
  IconButton,
  Grid,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Tabs,
  Tab,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import PageContainer from '../../../components/PageContainer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeeList, getEmployeeStats } from '../../../services/employees';
import { getConstructionStats } from '../../../services/constructions';
import FileBrowser from '../../../components/fileBrowser/FileBrowser';
import { useEmployeeAlert } from '../../../context/EmployeeAlertContext';
import { Construction, Done, Person, Settings } from '@mui/icons-material';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import type { AlertsSettings } from '../../../types';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import dayjs from 'dayjs';
import { getUpcomingVacations } from '../../../services/vacations';
import Loading from '../../../components/Loading';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { Note } from '../../../components/Note';
import { useScroll } from '../../../context/ScrollContext';
import BaseDialog from '../../../components/BaseDialog';
import {
  fetchAlertsSettings,
  updateAlertsSettings,
} from '../../../services/settings';
import { getHomeNote, saveHomeNote } from '../../../services/home';

interface EmployeeAlertsSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AlertsSettingsErrors {
  a1Warning: string;
  a1Critical: string;
  contractWarning: string;
  contractCritical: string;
}

const EmployeeAlertsSettings = ({
  isOpen,
  onClose,
}: EmployeeAlertsSettingsProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AlertsSettings>({
    a1Warning: 0,
    a1Critical: 0,
    contractWarning: 0,
    contractCritical: 0,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [formErrors, setFormErrors] = useState<AlertsSettingsErrors>({
    a1Warning: '',
    a1Critical: '',
    contractWarning: '',
    contractCritical: '',
  });

  const resetErrors = () => {
    setFormErrors({
      a1Warning: '',
      a1Critical: '',
      contractWarning: '',
      contractCritical: '',
    });
  };

  const validate = (): boolean => {
    let isValid = true;
    const newErrors: AlertsSettingsErrors = {
      a1Warning: '',
      a1Critical: '',
      contractWarning: '',
      contractCritical: '',
    };

    if (isNaN(formData.a1Warning) || formData.a1Warning < 0) {
      newErrors.a1Warning = 'Wartość musi być liczbą nieujemną';
      isValid = false;
    }

    if (isNaN(formData.a1Critical) || formData.a1Critical < 0) {
      newErrors.a1Critical = 'Wartość musi być liczbą nieujemną';
      isValid = false;
    }

    if (isNaN(formData.contractWarning) || formData.contractWarning < 0) {
      newErrors.contractWarning = 'Wartość musi być liczbą nieujemną';
      isValid = false;
    }

    if (isNaN(formData.contractCritical) || formData.contractCritical < 0) {
      newErrors.contractCritical = 'Wartość musi być liczbą nieujemną';
      isValid = false;
    }

    if (
      !isNaN(formData.a1Warning) &&
      !isNaN(formData.a1Critical) &&
      formData.a1Warning !== 0 &&
      formData.a1Critical !== 0
    ) {
      if (formData.a1Critical >= formData.a1Warning) {
        newErrors.a1Critical =
          'Wartość krytyczna musi być mniejsza niż ostrzeżenie';
        isValid = false;
      }
    }

    if (
      !isNaN(formData.contractWarning) &&
      !isNaN(formData.contractCritical) &&
      formData.contractWarning !== 0 &&
      formData.contractCritical !== 0
    ) {
      if (formData.contractCritical >= formData.contractWarning) {
        newErrors.contractCritical =
          'Wartość krytyczna musi być mniejsza niż ostrzeżenie';
        isValid = false;
      }
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const {
    data: alertsSettings,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['alertsSettings'],
    queryFn: fetchAlertsSettings,
    enabled: isOpen,
  });

  const notifications = useNotifications();

  const updateMutation = useMutation({
    mutationFn: updateAlertsSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertsSettings'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setHasChanges(false);
      notifications.show('Ustawienia alertów zostały zmienione.', {
        severity: 'success',
        autoHideDuration: 5000,
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Alerts settings update error:', error);
      notifications.show('Wystąpił błąd podczas zapisywania ustawień!', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    },
  });

  useEffect(() => {
    if (alertsSettings) {
      setFormData(alertsSettings);
      setHasChanges(false);
    }
  }, [alertsSettings]);

  const handleInputChange = (field: keyof AlertsSettings, value: string) => {
    const numValue = parseInt(value) || 0;

    setFormData((prev) => ({
      ...prev,
      [field]: numValue,
    }));

    if (alertsSettings) {
      const hasFieldChanged = alertsSettings[field] !== numValue;
      setHasChanges(hasFieldChanged);
    }
  };

  const handleSave = () => {
    if (!hasChanges) return;
    if (validate()) {
      updateMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    if (alertsSettings) {
      setFormData(alertsSettings);
    }
    setHasChanges(false);
    resetErrors();
    onClose();
  };

  return (
    <BaseDialog
      open={isOpen}
      onClose={handleClose}
      title="Ustawienia alertów"
      showConfirm={false}
      maxWidth="sm"
      fullWidth
      actions={
        <Stack direction="row" spacing={1}>
          <Button
            onClick={handleClose}
            variant="outlined"
            loading={updateMutation.isPending}
            color="inherit"
          >
            Anuluj
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!hasChanges}
            loading={updateMutation.isPending}
          >
            Zapisz
          </Button>
        </Stack>
      }
    >
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Błąd podczas ładowania ustawień: {error.message}
        </Alert>
      ) : (
        <>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Alerty umowy zatrudnienia
          </Typography>
          <Stack direction={'column'} spacing={3}>
            <TextField
              label="Liczba dni do ostrzeżenia"
              type="number"
              error={Boolean(formErrors.contractWarning)}
              helperText={formErrors.contractWarning}
              size="small"
              value={formData.contractWarning}
              onChange={(e) =>
                handleInputChange('contractWarning', e.target.value)
              }
              slotProps={{
                htmlInput: {
                  min: 0,
                },
              }}
            />
            <TextField
              label="Liczba dni do ostrzeżenia krytycznego"
              size="small"
              type="number"
              error={Boolean(formErrors.contractCritical)}
              helperText={formErrors.contractCritical}
              value={formData.contractCritical}
              onChange={(e) =>
                handleInputChange('contractCritical', e.target.value)
              }
              slotProps={{
                htmlInput: {
                  min: 0,
                },
              }}
            />
          </Stack>

          <Typography variant="subtitle2" sx={{ my: 2 }}>
            Alerty A1
          </Typography>
          <Stack direction={'column'} spacing={3} sx={{ mb: 3 }}>
            <TextField
              label="Liczba dni do ostrzeżenia"
              type="number"
              size="small"
              helperText={formErrors.a1Warning}
              error={Boolean(formErrors.a1Warning)}
              value={formData.a1Warning}
              onChange={(e) => handleInputChange('a1Warning', e.target.value)}
              slotProps={{
                htmlInput: {
                  min: 0,
                },
              }}
            />
            <TextField
              label="Liczba dni do ostrzeżenia krytycznego"
              type="number"
              error={Boolean(formErrors.a1Critical)}
              size="small"
              helperText={formErrors.a1Critical}
              value={formData.a1Critical}
              onChange={(e) => handleInputChange('a1Critical', e.target.value)}
              slotProps={{
                htmlInput: {
                  min: 0,
                },
              }}
            />
          </Stack>
        </>
      )}
    </BaseDialog>
  );
};

const EmployeeAlerts = () => {
  const { alerts, loading } = useEmployeeAlert();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

  const MAX_VISIBLE_ITEMS = 3;
  const hasMoreItems = alerts.length > MAX_VISIBLE_ITEMS;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Box>
      <Stack
        direction={'row'}
        alignItems={'center'}
        justifyContent={'space-between'}
        sx={{
          mb: 1,
        }}
      >
        <Stack direction={'row'} alignItems={'center'} spacing={1}>
          <ReportProblemIcon className="text-yellow-500" />
          <Typography variant="body1" className="font-medium">
            Uwagi dotyczące pracowników
          </Typography>
          {hasMoreItems && (
            <Chip
              label={`${alerts.length} ${alerts.length === 4 ? 'uwagi' : 'uwag'}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Stack>
        <IconButton
          sx={{ p: 0.5 }}
          onClick={() => setIsSettingsDialogOpen(true)}
        >
          <Settings />
        </IconButton>
      </Stack>
      <Box
        sx={{
          maxHeight: isExpanded ? 'none' : hasMoreItems ? 265 : 230,
          overflow: 'auto',
        }}
      >
        {loading ? (
          <Stack
            justifyContent={'center'}
            alignItems={'center'}
            sx={{ height: '100%' }}
          >
            <CircularProgress />
          </Stack>
        ) : (
          <List className="mb-2">
            {alerts.length === 0 ? (
              <Stack direction={'row'} spacing={1} className="mb-2">
                <Done />
                <Typography color={'textSecondary'}>Brak uwag</Typography>
              </Stack>
            ) : (
              alerts.map((alert) => (
                <ListItem
                  key={alert.id}
                  onClick={() => navigate(`/employees/${alert.employeeId}`)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    borderLeftWidth: '8px',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                  className={`${alert.severity === 'error' ? 'border-l-red-400' : 'border-l-yellow-400'} ${alert.severity === 'error' ? 'hover:bg-red-200' : 'hover:bg-amber-200'} ${alert.severity === 'error' ? 'bg-red-100' : 'bg-amber-100'} last:mb-0`}
                >
                  <Typography variant="subtitle2">{alert.title}</Typography>
                  <Typography variant="body2">{alert.message}</Typography>
                </ListItem>
              ))
            )}
          </List>
        )}
      </Box>
      {hasMoreItems && (
        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <IconButton
            onClick={toggleExpanded}
            size="small"
            className="text-gray-400"
          >
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      )}
      <EmployeeAlertsSettings
        isOpen={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
      />
    </Box>
  );
};

const UpcomingVacation = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: upcomingVacations, isLoading } = useQuery({
    queryKey: ['vacations', 'upcoming-vacations'],
    queryFn: getUpcomingVacations,
  });

  const groupedVacations = useMemo(() => {
    if (!upcomingVacations) return [];

    const uniqueGroups = new Map();

    upcomingVacations.forEach((vacation) => {
      if (!vacation.employeeActive) return;

      if (!uniqueGroups.has(vacation.groupId)) {
        uniqueGroups.set(vacation.groupId, {
          ...vacation,
          employeeName: vacation.employeeName ?? 'Nieznany pracownik',
        });
      }
    });

    return Array.from(uniqueGroups.values()).sort(
      (a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
    );
  }, [upcomingVacations]);

  const MAX_VISIBLE_ITEMS = 2;
  const hasMoreItems = groupedVacations.length > MAX_VISIBLE_ITEMS;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const { scrollToTop } = useScroll();

  const handleVacationClick = (vacation: any) => {
    const startMonth = dayjs(vacation.startDate).format('YYYY-MM');
    navigate(`/calendar?month=${startMonth}`);
    scrollToTop();
  };

  return (
    <Box>
      <Stack
        direction={'row'}
        alignItems={'center'}
        spacing={1}
        sx={{
          mb: 1,
        }}
      >
        <NotificationsIcon
          sx={{
            color: 'primary.main',
          }}
        />
        <Typography variant="body1" className="font-medium">
          Nadchodzące urlopy
        </Typography>
        {hasMoreItems && (
          <Chip
            label={`${groupedVacations.length} ${groupedVacations.length > 4 ? 'urlopów' : 'urlopy'}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        )}
      </Stack>
      {isLoading ? (
        <Stack direction={'row'} spacing={1} className="my-5">
          <Loading size={25} message="" />
        </Stack>
      ) : (
        <Box>
          <Box
            sx={{
              maxHeight: isExpanded ? 'none' : 180,
              overflow: 'auto',
              position: 'relative',
            }}
          >
            <List className="mb-2">
              {groupedVacations.length === 0 ? (
                <Stack direction={'row'} spacing={1}>
                  <Done />
                  <Typography color={'textSecondary'}>
                    Brak nadchodzących urlopów
                  </Typography>
                </Stack>
              ) : (
                groupedVacations.map((vacation) => (
                  <ListItem
                    key={vacation.groupId}
                    onClick={() => handleVacationClick(vacation)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      alignItems: 'flex-start',
                      mb: 1,
                    }}
                    className={`border-lightGray rounded-md border bg-blue-50/50 text-blue-950 last:mb-0 hover:bg-blue-100`}
                  >
                    <Typography variant="subtitle2">
                      {vacation.employeeName}
                    </Typography>
                    <Typography variant="body2">
                      {dayjs(vacation.startDate).format('DD.MM.YYYY')} -{' '}
                      {dayjs(vacation.endDate).format('DD.MM.YYYY')}
                    </Typography>
                  </ListItem>
                ))
              )}
            </List>
          </Box>
          {hasMoreItems && (
            <Box sx={{ textAlign: 'center', mb: 1 }}>
              <IconButton
                onClick={toggleExpanded}
                size="small"
                className="text-gray-400"
              >
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

const HomeNote = () => {
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const { data: home, isLoading: noteLoading } = useQuery({
    queryKey: ['home', 'note'],
    queryFn: getHomeNote,
  });

  const updateNoteMutation = useMutation({
    mutationFn: (newNote: string) => saveHomeNote(newNote),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['home', 'note'],
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

  return (
    <Note
      content={home?.note ?? ''}
      onSave={(note) => updateNoteMutation.mutate(note)}
      loading={updateNoteMutation.isPending || noteLoading}
    />
  );
};

const Home = () => {
  const navigate = useNavigate();

  const [tab, setTab] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const { data: employeeStats, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', 'stats'],
    queryFn: getEmployeeStats,
  });

  const { data: constructionStats, isLoading: constructionsLoading } = useQuery(
    {
      queryKey: ['constructions', 'stats'],
      queryFn: getConstructionStats,
    }
  );

  const handleEmployeesClick = useCallback(() => {
    navigate('/employees');
  }, [navigate]);

  const handleConstructionsClick = useCallback(() => {
    navigate('/constructions');
  }, [navigate]);

  return (
    <PageContainer
      breadcrumbs={[{ title: 'Strona główna' }]}
      fixedHeight={tab === 1}
    >
      <Box className="border-lightGray mb-3 overflow-hidden rounded-lg border bg-white px-2">
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
      </Box>

      <Grid
        container
        columns={12}
        spacing={{ xs: 1.5, md: 2, lg: 3 }}
        sx={{
          flex: 1,
          minHeight: 0,

          height: tab === 1 ? '100%' : 'auto',

          display: 'flex',
          flexDirection: tab === 1 ? 'column' : 'row',
          alignContent: 'flex-start',
          overflow: tab === 1 ? 'hidden' : 'visible',
        }}
      >
        {tab === 0 && (
          <>
            <Grid
              container
              columns={12}
              spacing={{ xs: 1.5, md: 2, lg: 3 }}
              size={{ xs: 12, lg: 6 }}
              alignContent={'flex-start'}
            >
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card
                  sx={{ boxShadow: 0, cursor: 'pointer' }}
                  onClick={handleEmployeesClick}
                  className="border-lightGray rounded-lg border hover:shadow-sm"
                >
                  {employeesLoading ? (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '200px',
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : (
                    <>
                      <CardContent className="p-4">
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          justifyContent={'space-between'}
                        >
                          <Box>
                            <Typography
                              variant="body1"
                              className="text-gray-600"
                            >
                              Pracownicy
                            </Typography>
                            <Typography variant="h4">
                              {employeeStats?.active || 0}
                            </Typography>
                          </Box>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <Person />
                          </Avatar>
                        </Stack>
                      </CardContent>
                      <Divider />
                      <Box className="px-4 py-2">
                        <Stack direction={'column'}>
                          <Typography
                            variant="overline"
                            className="text-gray-600"
                          >
                            Zarchiwizowani:{' '}
                            <Typography
                              component={'span'}
                              className="text-gray-800"
                            >
                              {Number(employeeStats?.total) -
                                Number(employeeStats?.active) || 0}
                            </Typography>
                          </Typography>
                          <Typography
                            variant="overline"
                            className="text-gray-600"
                          >
                            Wszyscy:{' '}
                            <Typography
                              component={'span'}
                              className="text-gray-800"
                            >
                              {Number(employeeStats?.total) || 0}
                            </Typography>
                          </Typography>
                        </Stack>
                      </Box>
                    </>
                  )}
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card
                  sx={{ boxShadow: 0, cursor: 'pointer' }}
                  onClick={handleConstructionsClick}
                  className="border-lightGray rounded-lg border hover:shadow-sm"
                >
                  {constructionsLoading ? (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '200px',
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : (
                    <>
                      <CardContent className="p-4">
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          justifyContent={'space-between'}
                        >
                          <Box>
                            <Typography
                              variant="body1"
                              className="text-gray-600"
                            >
                              Aktywne budowy
                            </Typography>
                            <Typography variant="h4">
                              {constructionStats?.active || 0}
                            </Typography>
                          </Box>
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            <Construction />
                          </Avatar>
                        </Stack>
                      </CardContent>
                      <Divider />
                      <Box className="px-4 py-2">
                        <Stack direction={'column'}>
                          <Typography
                            variant="overline"
                            className="text-gray-600"
                          >
                            Zakończone:{' '}
                            <Typography
                              component={'span'}
                              className="text-gray-800"
                            >
                              {Number(constructionStats?.total) -
                                Number(constructionStats?.active) || 0}
                            </Typography>
                          </Typography>
                          <Typography
                            variant="overline"
                            className="text-gray-600"
                          >
                            Wszystkie:{' '}
                            <Typography
                              component={'span'}
                              className="text-gray-800"
                            >
                              {Number(constructionStats?.total) || 0}
                            </Typography>
                          </Typography>
                        </Stack>
                      </Box>
                    </>
                  )}
                </Card>
              </Grid>
              <Grid
                size={{ xs: 12 }}
                sx={{
                  display: { xs: 'none', lg: 'block' },
                }}
              >
                <Card
                  sx={{ boxShadow: 0 }}
                  className="border-lightGray rounded-lg border"
                >
                  <CardContent className="pb-0">
                    <UpcomingVacation />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid
              container
              columns={12}
              spacing={{ xs: 1.5, md: 2, lg: 3 }}
              size={{ xs: 12, lg: 6 }}
              alignContent={'flex-start'}
            >
              <Grid size={{ xs: 12 }}>
                <Card
                  sx={{ boxShadow: 0 }}
                  className="border-lightGray rounded-lg border"
                >
                  <CardContent className="pb-0">
                    <EmployeeAlerts />
                  </CardContent>
                </Card>
              </Grid>
              <Grid
                size={{ xs: 12 }}
                sx={{
                  display: { xs: 'block', lg: 'none' },
                }}
              >
                <Card
                  sx={{ boxShadow: 0 }}
                  className="border-lightGray rounded-lg border"
                >
                  <CardContent className="pb-0">
                    <UpcomingVacation />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <HomeNote />
            </Grid>
          </>
        )}
        {tab === 1 && (
          <Grid
            size={{ xs: 12 }}
            sx={{
              flex: 1,
              display: 'flex',
              height: '100%',
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <FileBrowser baseDirectory="general" />
          </Grid>
        )}
      </Grid>
    </PageContainer>
  );
};

export default Home;
