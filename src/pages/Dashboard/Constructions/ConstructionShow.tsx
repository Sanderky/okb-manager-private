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

import { type Construction } from '../../../types';
import {
  getConstruction,
  updateConstruction,
} from '../../../api/constructions';

import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';

import { Chip, Divider, IconButton, Tab, Tabs, TextField } from '@mui/material';
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

export default function ConstructionShow() {
  const { constructionId } = useParams<{ constructionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notFound, setNotFound] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

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
    isLoading,
    error,
  } = useQuery({
    queryKey: ['construction', constructionId],
    queryFn: () => getConstruction(constructionId!),
    enabled: !!constructionId,
  });

  useEffect(() => {
    if (construction) {
      setNote(construction.note ?? '');
      setNotFound(false);
    } else if (!isLoading) {
      setNotFound(true);
    }
  }, [construction, isLoading]);

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
    setEditNote(false);
    updateNoteMutation.mutate(note);
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

  const personalFields = [
    { key: 'name', label: 'Nazwa budowy' },
    { key: 'location', label: 'Lokalizacja' },
    { key: 'contractor', label: 'Wykonawca' },
    { key: 'startDate', label: 'Data rozpoczęcia' },
    { key: 'endDate', label: 'Data zakończenia' },
    // { key: 'inProgress', label: 'W trakcie realizacji' },
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
            Nie znaleziono budowy. Mogła zostać usunięta lub nie istnieje.
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

    return construction ? (
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
                label={construction?.inProgress ? 'W trakcie' : 'Zakończona'}
                className={
                  construction?.inProgress
                    ? 'bg-blue-400/50'
                    : 'bg-amber-400/50'
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
                  Informacje
                </Typography>
                {/* <Chip
                label={construction?.inProgress ? 'W trakcie' : 'Zakończona'}
                className={
                  construction?.inProgress
                    ? 'bg-blue-400/50'
                    : 'bg-amber-400/50'
                }
                variant="filled"
              /> */}
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
                          const value = construction[key as keyof Construction];
                          if (!value && key !== 'inProgress') {
                            return <em className="text-gray-400">Brak</em>;
                          }
                          if (key === 'startDate' || key === 'endDate') {
                            return dayjs(value).format('DD/MM/YYYY');
                          }
                          if (key === 'inProgress') {
                            return value ? 'Tak' : 'Nie';
                          }
                          return String(value);
                        })() || <em className="text-gray-400">Brak</em>}
                        {/* {(() => {
                        const value = construction[key as keyof Construction];
                        if (!value) {
                          return <em className="text-gray-400">Brak</em>;
                        }
                        return String(value);
                      })() || <em className="text-gray-400">Brak</em>} */}
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
                          Edytuj budowę
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: 'text.secondary' }}
                        >
                          Zmiana danych budowy
                        </Typography>
                      </div>
                      <Button
                        variant="contained"
                        onClick={handleConstructionEdit}
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
                />
                <Stack direction="row" spacing={2}>
                  <IconButton
                    onClick={() => {
                      setEditNote(!editNote);
                      note !== (construction?.note ?? '') &&
                        setNote(construction?.note ?? '');
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
          </Grid>
        )}
      </Box>
    ) : null;
  }, [
    isLoading,
    error,
    construction,
    handleBack,
    handleConstructionEdit,
    personalFields,
    showDebug,
    note,
    updateNoteMutation.isPending,
    updateNoteMutation.isError,
    handleSaveNote,
  ]);

  const pageTitle = construction?.name || 'Szczegóły Budowy';

  return (
    <PageContainer
      title={`Budowa ${pageTitle}`}
      breadcrumbs={[
        { title: 'Budowy', path: '/constructions' },
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
