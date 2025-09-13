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
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';

import { Chip, IconButton, Tab, Tabs } from '@mui/material';
import { useParams } from 'react-router';
import dayjs from 'dayjs';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const [employee, setEmployee] = useState<Employee | null>(null);

  const [tab, setTab] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const loadData = useCallback(async () => {
    setError(null);
    setNotFound(false);
    setIsLoading(true);

    let isActive = true; // guard against state update after unmount

    try {
      if (!employeeId) {
        throw new Error('Brak ID pracownika.');
      }
      const showData = await getEmployee(employeeId);
      if (!isActive) return;
      if (!showData) {
        setNotFound(true);
        setEmployee(null);
      } else {
        setEmployee(showData);
      }
    } catch (showDataError) {
      if (!isActive) return;
      setError(normalizeError(showDataError));
    } finally {
      if (isActive) setIsLoading(false);
    }
    return () => {
      isActive = false;
    };
  }, [employeeId]);

  useEffect(() => {
    // loadData returns a promise (ignored) — no cleanup needed
    void loadData();
  }, [loadData]);

  const handleEmployeeEdit = useCallback(() => {
    navigate(`/employees/${employeeId}/edit`);
  }, [navigate, employeeId]);

  const handleBack = useCallback(() => {
    navigate('/employees');
  }, [navigate]);

  const handleRetry = useCallback(() => {
    loadData();
  }, [loadData]);

  const handleEmployeeDismiss = useCallback(async () => {
    if (!employeeId || !employee?.status) {
      return;
    }
    setIsDismissing(true);
    try {
      await updateEmployee(employeeId, { status: false });
      setEmployee((prev) => (prev ? { ...prev, status: false } : null));
    } catch (dismissError) {
      setError(normalizeError(dismissError));
    } finally {
      setIsDismissing(false);
    }
  }, [employeeId, employee]);

  const personalFields = [
    { key: 'name', label: 'Imię' },

    { key: 'email', label: 'E-mail' },
    { key: 'phone', label: 'Telefon' },
    { key: 'address', label: 'Adres' },
    { key: 'position', label: 'Stanowisko' },
  ];

  const employmentFields = [
    { key: 'hireDate', label: 'Data zatrudnienia' },
    { key: 'contractEndDate', label: 'Data wygaśnięcia umowy' },
    { key: 'file', label: 'Plik' },
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
                <Button size="small" onClick={handleRetry} variant="outlined">
                  Ponów
                </Button>
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
            {error.code
              ? `${error.message} (kod: ${error.code})`
              : error.message}
          </Alert>
          {showDebug && (
            <Paper sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }} variant="outlined">
              <Typography
                variant="caption"
                component="pre"
                sx={{ m: 0, whiteSpace: 'pre-wrap' }}
              >
                {JSON.stringify(error.raw, null, 2)}
              </Typography>
            </Paper>
          )}
        </Box>
      );
    }

    if (notFound) {
      return (
        <Box sx={{ width: '100%' }}>
          <Alert
            severity="info"
            action={
              <Button size="small" onClick={handleRetry} variant="outlined">
                Odśwież
              </Button>
            }
          >
            Nie znaleziono pracownika. Mógł zostać usunięty lub nie istnieje.
          </Alert>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleBack}>
              Wróć
            </Button>
            <Button variant="outlined" onClick={handleRetry}>
              Spróbuj ponownie
            </Button>
          </Stack>
        </Box>
      );
    }

    return employee ? (
      <Box
        sx={{ width: '100%' }}
        className="border-lightGray rounded-lg border bg-white px-6 py-4"
      >
        <Grid container spacing={2} columns={12} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6 }}>
            <Tabs
              value={tab}
              onChange={handleTabChange}
              aria-label="Zakładki pracownika"
            >
              <Tab label="Informacje" />
              <Tab label="Pliki" />
            </Tabs>
          </Grid>
          {tab === 0 && (
            <Grid
              container
              size={{ xs: 6 }}
              sx={{
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <IconButton
                color="default"
                className="border-darkGray border"
                aria-label="Drukuj"
              >
                <LocalPrintshopIcon />
              </IconButton>
            </Grid>
          )}
        </Grid>
        {tab === 0 && (
          <Grid container spacing={2} columns={12}>
            <Grid
              size={{ xs: 12, md: 8, lg: 8 }}
              className="border-lightGray rounded-lg border bg-white p-5"
              sx={{ flexGrow: 1 }}
            >
              <Stack direction="row" justifyContent="space-between" mb={3}>
                <Typography
                  variant="subtitle1"
                  className="text-lg font-semibold"
                >
                  Informacje osobiste
                </Typography>
                <Chip
                  label={employee?.status ? 'Zatrudniony' : 'Nie zatrudniony'}
                  color={employee?.status ? 'primary' : 'error'}
                  variant="filled"
                />
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
                      >
                        {(() => {
                          const value = employee[key as keyof Employee];
                          if (!value) {
                            return <em className="text-gray-400">Brak</em>;
                          }
                          if (key === 'hireDate' || key === 'contractEndDate') {
                            return dayjs(value).format('YYYY-MM-DD');
                          }
                          return String(value);
                        })() || <em className="text-gray-400">Brak</em>}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid
              size={{ xs: 12, md: 4, lg: 4 }}
              className="border-lightGray rounded-lg border bg-white p-5"
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
                <Stack
                  direction={{ xs: 'column', xl: 'row' }}
                  justifyContent={{ xs: 'flex-start', xl: 'space-between' }}
                  alignItems={{ xs: 'flex-start', xl: 'center' }}
                  sx={{ width: '100%' }}
                  spacing={{ xs: 1, xl: 2 }}
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
                <Stack
                  direction={{ xs: 'column', xl: 'row' }}
                  justifyContent={{ xs: 'flex-start', xl: 'space-between' }}
                  alignItems={{ xs: 'flex-start', xl: 'center' }}
                  sx={{ width: '100%' }}
                  spacing={{ xs: 1, xl: 2 }}
                >
                  <div>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Zwolnij pracownika
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'text.secondary' }}
                    >
                      Zmienia status pracownika na "Nie zatrudniony".
                    </Typography>
                  </div>
                  <Button
                    variant="contained"
                    color="error"
                    sx={{ minWidth: 120 }}
                    onClick={handleEmployeeDismiss}
                    disabled={!employee?.status || isDismissing}
                  >
                    {isDismissing ? 'Zwalnianie...' : 'Zwolnij'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
            <Grid
              size={{ xs: 12, lg: 6 }}
              className="border-lightGray rounded-lg border bg-white p-5"
              sx={{ flexGrow: 1 }}
            >
              <Stack direction="row" justifyContent="space-between" mb={3}>
                <Typography
                  variant="subtitle1"
                  className="text-lg font-semibold"
                >
                  Szczegóły zatrudnienia
                </Typography>
              </Stack>
              <Grid container spacing={2}>
                {employmentFields.map(({ key, label }) => (
                  <Grid key={key} size={{ xs: 12 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body1" className="font-medium">
                        {label}:
                      </Typography>
                      <Typography
                        variant="body1"
                        className="border-lightGray rounded border px-3 py-1 text-gray-700"
                      >
                        {(() => {
                          const value = employee[key as keyof Employee];
                          if (!value) {
                            return <em className="text-gray-400">Brak</em>;
                          }
                          if (key === 'hireDate' || key === 'contractEndDate') {
                            return dayjs(value).format('YYYY-MM-DD');
                          }
                          return String(value);
                        })() || <em className="text-gray-400">Brak</em>}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid
              size={{ xs: 12, lg: 6 }}
              className="border-lightGray rounded-lg border bg-white p-5"
            >
              <Stack direction="row" justifyContent="space-between" mb={3}>
                <Typography
                  variant="subtitle1"
                  className="text-lg font-semibold"
                >
                  Powiadomienia i terminy
                </Typography>
              </Stack>
              <Grid container spacing={3}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems={'center'}
                  sx={{ width: '100%' }}
                  spacing={2}
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
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems={'center'}
                  sx={{ width: '100%' }}
                  spacing={2}
                >
                  <div>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Zwolnij pracownika
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'text.secondary' }}
                    >
                      Zmienia status pracownika na "Nie zatrudniony".
                    </Typography>
                  </div>
                </Stack>
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
    handleRetry,
    notFound,
    showDebug,
    handleEmployeeDismiss,
    isDismissing,
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
