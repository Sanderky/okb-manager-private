import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '@/shared/ui/PageContainer';
import { AlertTitle, Chip, Stack, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { alpha, Grid } from '@mui/system';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import BaseDialog from '@/shared/ui/BaseDialog';
import Loading from '@/shared/ui/Loading';
import useLoading from '@/shared/lib/useLoading';
import { useScroll } from '@/shared/lib/ScrollContext';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import {
  ConstructionApi,
  shouldBeInactive,
  type Construction,
} from '@/entities/construction';
import { deleteFolderRecursive } from '@/shared/api/storage';
import {
  ConstructionForm,
  FinishConstruction,
  ResumeConstruction,
  validate,
  type ConstructionFormState,
  type FormFieldValue,
} from '@/features/constructions';

export function ConstructionEditPage() {
  const { constructionId } = useParams<{ constructionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notifications = useNotifications();
  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);

  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  const { scrollToTop } = useScroll();

  const registerFieldRef = (name: string, el: HTMLInputElement | null) => {
    formRefs.current[name] = el;
  };

  const {
    data: construction,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['construction', constructionId],
    queryFn: () => ConstructionApi.getConstruction(constructionId!),
    refetchOnWindowFocus: false,
  });

  const [formState, setFormState] = React.useState<ConstructionFormState>({
    values: {},
    errors: {},
  });

  useEffect(() => {
    if (construction) {
      setFormState({ values: construction, errors: {} });
    }
  }, [construction]);

  const updateMutation = useMutation({
    mutationFn: (values: Partial<Construction>) =>
      ConstructionApi.updateConstruction(constructionId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['construction', constructionId],
      });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      notifications.show('Zmiany zostały pomyślnie zapisane.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      navigate(`/constructions/${constructionId}`);
      scrollToTop();
    },
    onError: (error: Error) => {
      console.error('Update construction error:', error);
      notifications.show('Wystąpił błąd podczas zapisywania danych budowy.', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => ConstructionApi.removeConstruction(constructionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
    },
  });

  const handleFieldChange = useCallback(
    (name: keyof ConstructionFormState['values'], value: FormFieldValue) => {
      setFormState((prevState) => ({
        ...prevState,
        values: { ...prevState.values, [name]: value },
        errors: { ...prevState.errors, [name]: undefined },
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const validationErrors = validate(formState.values);
      if (Object.keys(validationErrors).length > 0) {
        setFormState((prev) => ({ ...prev, errors: validationErrors }));
        notifications.show('Proszę poprawić błędy w formularzu.', {
          severity: 'error',
          autoHideDuration: 3000,
        });
        const firstErrorKey = Object.keys(validationErrors)[0];
        const firstErrorInput = formRefs.current[firstErrorKey];
        if (firstErrorInput) {
          firstErrorInput.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
        return;
      }

      const changedValues: Partial<Omit<Construction, 'id'>> = {
        ...formState.values,
        name: formState.values.name?.trim(),
        location: formState.values.location?.trim(),
        contractorId: formState.values.contractorId
          ? formState.values.contractorId
          : null,
        status: !shouldBeInactive(formState.values.endDate),
      };

      // Object.keys(formState.values).forEach((key) => {
      //   const field = key as keyof Construction;
      //   if (field === 'id') return;

      //   if (formState.values[field] !== construction?.[field]) {
      //     const constructionKey = field as keyof Omit<Construction, 'id'>;
      //     changedValues[constructionKey] = formState.values[field] as never;
      //   }
      // });

      // if (Object.keys(changedValues).length === 0) {
      //   return;
      // }

      startActionLoading();
      try {
        await updateMutation.mutateAsync(changedValues);
      } finally {
        stopActionLoading();
      }
    },
    [
      formState.values,
      updateMutation,
      notifications,
      startActionLoading,
      stopActionLoading,
    ]
  );

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConstruction = useCallback(async () => {
    if (!construction) return;

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync();
      await deleteFolderRecursive(`/constructions/${construction.id}`);
      setDeleteDialogOpen(false);
      notifications.show('Budowa została pomyślnie usunięta.', {
        severity: 'info',
        autoHideDuration: 5000,
      });
      navigate('/constructions');
    } catch (error) {
      setDeleteDialogOpen(false);
      console.error('Delete employee error:', error);
      notifications.show('Wystąpił błąd podczas usuwania budowy.', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteMutation, navigate, notifications, construction]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
  }, []);

  const isFormLoading = actionLoading || isDeleting;

  const renderContent = () => {
    if (isLoading || actionLoading) {
      return <Loading message="Ładowanie danych budowy..." />;
    }

    if (error) {
      return (
        <Grid
          container
          columns={12}
          alignItems={'flex-start'}
          className="w-full"
        >
          <Grid size={{ xs: 12 }} className="w-full">
            <Alert severity="error">
              Wystąpił błąd podczas ładowania danych budowy.
            </Alert>
          </Grid>
        </Grid>
      );
    }

    if (!construction) {
      return (
        <Grid
          container
          columns={12}
          alignItems={'flex-start'}
          className="w-full"
        >
          <Grid size={{ xs: 12 }} className="w-full">
            <Alert severity="warning">Nie znaleziono danych budowy.</Alert>
          </Grid>
        </Grid>
      );
    }

    return (
      <>
        <Grid container columns={12} spacing={{ xs: 3, lg: 2 }}>
          <Grid size={{ xs: 12, lg: 8, xl: 9 }}>
            <Box
              sx={(theme) => ({
                width: '100%',
                maxWidth: { sm: '100%', md: '1790px' },
                // boxShadow: 1,
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              })}
              className="rounded-lg p-3 md:p-4"
            >
              <ConstructionForm
                formState={formState}
                onFieldChange={handleFieldChange}
                onSubmit={handleSubmit}
                isSubmitting={actionLoading}
                submitError={
                  updateMutation.isError
                    ? 'Wystąpił błąd podczas aktualizacji budowy.'
                    : null
                }
                isEditForm={true}
                registerFieldRef={registerFieldRef}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, lg: 4, xl: 3 }}>
            {construction.status ? (
              <Stack
                direction={{ xs: 'column' }}
                justifyContent={{ xs: 'flex-start' }}
                alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                spacing={{ xs: 1, xl: 2 }}
                className="mb-4 rounded-lg p-3"
                maxWidth={'400px'}
                sx={(theme) => ({
                  border: `1px solid ${theme.palette.warning.main}`,
                  background: alpha(theme.palette.warning.main, 0.1),
                })}
              >
                <div>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Zakończ budowę
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Status budowy zmienia się na "Zakończona".
                  </Typography>
                </div>
                <Button
                  variant="contained"
                  color={'warning'}
                  sx={{ minWidth: 120 }}
                  onClick={() => setEndDialogOpen(true)}
                  loading={isFormLoading}
                  startIcon={<ArchiveIcon />}
                >
                  Zakończ
                </Button>
              </Stack>
            ) : (
              <Stack
                direction={{ xs: 'column' }}
                justifyContent={{ xs: 'flex-start' }}
                alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                spacing={{ xs: 1, xl: 2 }}
                className="mb-4 rounded-lg p-3"
                maxWidth={'400px'}
                sx={(theme) => ({
                  border: `1px solid ${theme.palette.success.main}`,
                  background: alpha(theme.palette.success.main, 0.1),
                })}
              >
                <div>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Aktywuj budowę
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Status budowy zmienia się na "W trakcie".
                  </Typography>
                </div>
                <Button
                  variant="contained"
                  color={'success'}
                  sx={{ minWidth: 120 }}
                  onClick={() => setResumeDialogOpen(true)}
                  loading={isFormLoading}
                  startIcon={<UnarchiveIcon />}
                >
                  Aktywuj
                </Button>
              </Stack>
            )}
            <Stack
              direction={{ xs: 'column' }}
              justifyContent={{ xs: 'flex-start' }}
              alignItems={{ xs: 'stretch', sm: 'flex-start' }}
              spacing={{ xs: 1, xl: 2 }}
              className="rounded-lg border p-3"
              maxWidth={'400px'}
              sx={(theme) => ({
                border: `1px solid ${theme.palette.error.main}`,
                background: alpha(theme.palette.error.main, 0.1),
              })}
            >
              <div>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Usuń budowę
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Trwale usuwa budowę z bazy danych. Tej operacji nie można
                  cofnąć.
                </Typography>
              </div>
              <Button
                variant="contained"
                color="error"
                sx={{ minWidth: 120 }}
                onClick={handleDeleteClick}
                loading={isDeleting || isLoading || actionLoading}
                startIcon={<HighlightOffIcon />}
              >
                Usuń
              </Button>
            </Stack>
          </Grid>
        </Grid>

        <FinishConstruction
          open={endDialogOpen}
          onClose={() => setEndDialogOpen(false)}
          construction={construction}
        />
        <ResumeConstruction
          open={resumeDialogOpen}
          onClose={() => setResumeDialogOpen(false)}
          construction={construction}
        />

        <BaseDialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <WarningAmberIcon className="text-red-600" />
              <span>Usuwanie budowy</span>
            </Stack>
          }
          actions={
            <Stack direction="row" spacing={1}>
              <Button
                onClick={handleDeleteCancel}
                variant="outlined"
                loading={isDeleting}
                color="inherit"
              >
                Anuluj
              </Button>
              <Button
                onClick={handleDeleteConstruction}
                variant="contained"
                loading={isDeleting}
                color="error"
                disabled={
                  deleteConfirmation.toLocaleLowerCase() !==
                  construction.name.trim().toLocaleLowerCase()
                }
              >
                Usuń
              </Button>
            </Stack>
          }
          loading={isDeleting}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body1" className="text-gray-600">
              Czy na pewno chcesz usunąć <strong>{construction.name}</strong>?
            </Typography>
            <Typography variant="body1" className="text-gray-600">
              Budowa zostanie usunięta z bazy danych łącznie ze wszytkimi
              plikami oraz powiązanymi informacjami.
            </Typography>
            <Alert severity="error">
              <AlertTitle>Uwaga!</AlertTitle>
              Tej operacji nie można cofnąć. Zamiast tego, proszę rozważyć
              zakończenie budowy.
            </Alert>
            <Stack sx={{ mt: 2 }} direction={'column'} spacing={0.5}>
              <Typography variant="subtitle2">
                Aby usunąć budowę, wprowadź poniżej jej pełną nazwę:
              </Typography>
              <TextField
                value={deleteConfirmation}
                size="small"
                onChange={(e) => setDeleteConfirmation(e.target.value)}
              />
            </Stack>
          </Box>
        </BaseDialog>
      </>
    );
  };

  const pageTitle = construction?.name || 'budowy';

  return (
    <PageContainer
      title={`Edycja ${pageTitle}`}
      breadcrumbs={[
        { title: 'Budowy', path: '/constructions' },
        {
          title: construction?.name || '...',
          path: `/constructions/${constructionId}`,
        },
        { title: 'Edytuj' },
      ]}
      actions={
        <Stack direction="row" alignItems="center">
          {!error ? (
            <Chip
              label={
                isLoading || isFormLoading ? (
                  <Loading size={20} message="" />
                ) : construction?.status ? (
                  'W trakcie'
                ) : (
                  'Zakończona'
                )
              }
              className={
                isLoading || isFormLoading
                  ? 'bg-gray-300/50 text-gray-600'
                  : construction?.status
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
          ) : null}
        </Stack>
      }
    >
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          width: '100%',
          px: error ? 0 : { xs: 0.5, sm: 2 },
          py: error ? 0 : 2,
        }}
      >
        {renderContent()}
      </Box>
    </PageContainer>
  );
}
