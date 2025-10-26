import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate, useParams } from 'react-router';
import {
  getConstruction,
  removeConstruction,
  updateConstruction,
} from '../../../api/constructions';
import type { Construction } from '../../../types';
import ConstructionForm, {
  type FormFieldValue,
  type ConstructionFormState,
  validate,
} from './ConstructionForm';
import PageContainer from '../../../components/PageContainer';
import { AlertTitle, Stack, Typography } from '@mui/material';

import { useCallback, useEffect } from 'react';
import { useDialogs } from '../../../hooks/useDialogs/useDialogs';
import { Grid } from '@mui/system';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import useNotifications from '../../../hooks/useNotifications/useNotifications';

export default function ConstructionEdit() {
  const { constructionId } = useParams<{ constructionId: string }>();
  const navigate = useNavigate();
  const dialogs = useDialogs();
  const queryClient = useQueryClient();
  const notifications = useNotifications();

  const {
    data: construction,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['construction', constructionId],
    queryFn: () => getConstruction(constructionId!),
    enabled: !!constructionId,
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
      updateConstruction(constructionId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['construction', constructionId],
      });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
      notifications.show('Zmiany zostały pomyślnie zapisane.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      navigate(`/constructions/${constructionId}`);
    },
    onError: (error: Error) => {
      notifications.show(`Błąd zapisu: ${error.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => removeConstruction(constructionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
      notifications.show('Budowa została usunięta.', {
        severity: 'info',
        autoHideDuration: 3000,
      });
      navigate('/constructions');
    },
    onError: (error: Error) => {
      notifications.show(`Błąd usuwania: ${error.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
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
        notifications.show('Proszę poprawić błędy w formularzu', {
          severity: 'error',
          autoHideDuration: 3000,
        });
        return;
      }

      const changedValues: Partial<Omit<Construction, 'id'>> = {};
      Object.keys(formState.values).forEach((key) => {
        const field = key as keyof Construction;
        if (field === 'id') return;

        if (formState.values[field] !== construction?.[field]) {
          // Use type assertion for the specific field
          changedValues[field as keyof Omit<Construction, 'id'>] = formState
            .values[field] as any;
        }
      });

      if (Object.keys(changedValues).length === 0) {
        notifications.show('Nie wprowadzono żadnych zmian', {
          severity: 'info',
          autoHideDuration: 3000,
        });
        return;
      }

      updateMutation.mutate(changedValues);
    },
    [formState.values, construction, updateMutation, notifications]
  );

  const handleConstructionDelete = useCallback(async () => {
    if (!construction) return;

    const confirmed = await dialogs.confirm(
      <Stack direction="column" spacing={2}>
        <div>
          <Typography variant="body1" className="mb-1 text-gray-600">
            Czy na pewno chcesz usunąć <strong>{construction.name}</strong>?
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            Ta akcja usunie budowę z systemu i wszystkie powiązane z nią dane.
          </Typography>
        </div>
        <Alert severity="error">
          <AlertTitle>Uwaga!</AlertTitle>
          Proszę zachować ostrożność, tej operacji nie można cofnąć.
        </Alert>
      </Stack>,
      {
        title: (
          <Stack direction="row" spacing={2} alignItems="center">
            <WarningAmberIcon className="text-red-600" />
            <Typography variant="h6" className="text-red-600">
              Usuwanie budowy
            </Typography>
          </Stack>
        ),
        severity: 'error',
        okText: 'Usuń',
        cancelText: 'Anuluj',
      }
    );

    if (confirmed) {
      deleteMutation.mutate();
    }
  }, [construction, dialogs, deleteMutation]);

  const renderContent = () => {
    if (isLoading || updateMutation.isPending || deleteMutation.isPending) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            py: 4,
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error">{(error as Error).message}</Alert>;
    }

    if (!construction) {
      return <Alert severity="warning">Nie znaleziono danych budowy.</Alert>;
    }

    return (
      <Grid container columns={12} spacing={{ xs: 3, lg: 2 }}>
        <Grid size={{ xs: 12, lg: 8, xl: 9 }}>
          <Box
            sx={{ width: '100%', maxWidth: { sm: '100%', md: '1790px' } }}
            className="border-lightGray rounded-lg border bg-white px-3 pt-4 pb-6 md:px-6"
          >
            <ConstructionForm
              formState={formState}
              onFieldChange={handleFieldChange}
              onSubmit={handleSubmit}
              isSubmitting={updateMutation.isPending}
              submitError={
                updateMutation.isError ? updateMutation.error.message : null
              }
              isEditForm={true}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, lg: 4, xl: 3 }}>
          <Stack
            direction={{ xs: 'column' }}
            justifyContent={{ xs: 'flex-start' }}
            alignItems={{ xs: 'stretch', sm: 'flex-start' }}
            spacing={{ xs: 1, xl: 2 }}
            className="rounded-lg border border-red-500/25 bg-red-600/5! p-3"
            maxWidth={'400px'}
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
              onClick={handleConstructionDelete}
              disabled={deleteMutation.isPending}
              startIcon={<HighlightOffIcon />}
            >
              {deleteMutation.isPending ? 'Usuwanie...' : 'Usuń'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
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
    >
      <Box sx={{ display: 'flex', flex: 1, width: '100%' }}>
        {renderContent()}
      </Box>
    </PageContainer>
  );
}
