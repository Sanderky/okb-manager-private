import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate, useParams } from 'react-router';
import {
  getEmployee,
  removeEmployee,
  updateEmployee,
} from '../../../api/employees';
import type { Employee } from '../../../types';
import EmployeeForm, {
  type FormFieldValue,
  type EmployeeFormState,
  validate,
} from './EmployeeForm';
import PageContainer from '../../../components/PageContainer';
import { AlertTitle, Divider, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useCallback, useEffect, useState } from 'react';
import { useDialogs } from '../../../hooks/useDialogs/useDialogs';
import { Grid } from '@mui/system';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

export default function EmployeeEdit() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const dialogs = useDialogs();
  const queryClient = useQueryClient();
  const notifications = useNotifications();
  const [isSubmited, setIsSubmited] = useState(false);

  const {
    data: employee,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => getEmployee(employeeId!),
    enabled: !!employeeId,
  });

  const [formState, setFormState] = React.useState<EmployeeFormState>({
    values: {},
    errors: {},
  });

  useEffect(() => {
    if (employee) {
      setFormState({ values: employee, errors: {} });
    }
  }, [employee]);

  const updateMutation = useMutation({
    mutationFn: (values: Partial<Employee>) =>
      updateEmployee(employeeId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      notifications.show('Zmiany zostały pomyślnie zapisane.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      navigate(`/employees/${employeeId}`);
      setIsSubmited(false);
    },
    onError: (error: Error) => {
      notifications.show(`Błąd zapisu: ${error.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
      setIsSubmited(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => removeEmployee(employeeId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      notifications.show('Pracownik został usunięty.', {
        severity: 'info',
        autoHideDuration: 3000,
      });
      navigate('/employees');
      setIsSubmited(false);
    },
    onError: (error: Error) => {
      notifications.show(`Błąd usuwania: ${error.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
      setIsSubmited(false);
    },
  });

  const handleFieldChange = React.useCallback(
    (
      name: keyof EmployeeFormState['values'],
      value: FormFieldValue | object | null
    ) => {
      setFormState((prevState) => ({
        ...prevState,
        values: { ...prevState.values, [name]: value },
        errors: { ...prevState.errors, [name]: undefined },
      }));
    },
    []
  );

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const validationErrors = validate(formState.values);
      if (Object.keys(validationErrors).length > 0) {
        setFormState((prev) => ({ ...prev, errors: validationErrors }));
        return;
      }
      setIsSubmited(true);
      updateMutation.mutate(formState.values);
    },
    [formState.values, updateMutation]
  );

  const handleEmployeeDelete = useCallback(async () => {
    if (!employee) return;

    const confirmed = await dialogs.confirm(
      <Stack direction="column" spacing={2}>
        <div>
          <Typography variant="body1" className="mb-1 text-gray-600">
            Czy na pewno chcesz usunąć <strong>{employee.name}</strong>?
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
  }, [employee, dialogs, deleteMutation]);

  const handleBack = React.useCallback(() => {
    navigate(`/employees/${employeeId}`);
  }, [navigate, employeeId]);

  const renderContent = () => {
    if (isLoading || isSubmited) {
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
          <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
            Ładowanie danych pracownika...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error">{(error as Error).message}</Alert>;
    }

    if (!employee) {
      return (
        <Alert severity="warning">Nie znaleziono danych pracownika.</Alert>
      );
    }

    return (
      <Grid container columns={12} spacing={{ xs: 3, lg: 2 }}>
        <Grid size={{ xs: 12, lg: 8, xl: 9 }}>
          <Box
            sx={{ width: '100%', maxWidth: { sm: '100%', md: '1790px' } }}
            className="border-lightGray rounded-lg border bg-white p-6"
          >
            <EmployeeForm
              formState={formState}
              onFieldChange={handleFieldChange}
              onSubmit={handleSubmit}
              isSubmitting={updateMutation.isPending}
              submitError={
                updateMutation.isError ? 'Wystąpił błąd podczas zapisu.' : null
              }
              isEditForm={true}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, lg: 4, xl: 3 }}>
          <Stack
            direction={{ xs: 'column' }}
            justifyContent={{ xs: 'flex-start' }}
            alignItems={{ xs: 'flex-start' }}
            spacing={{ xs: 1, xl: 2 }}
            className="rounded-lg border border-red-500/25 bg-red-600/5! p-3"
          >
            <div>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Usuń pracownika
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Trwale usuwa pracownika z bazy danych. Tej operacji nie można
                cofnąć.
              </Typography>
            </div>
            <Button
              variant="contained"
              color="error"
              sx={{ minWidth: 120 }}
              onClick={handleEmployeeDelete}
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

  const pageTitle = employee?.name || 'pracownika';

  return (
    <PageContainer
      title={`Edycja ${pageTitle}`}
      breadcrumbs={[
        { title: 'Pracownicy', path: '/employees' },
        {
          title: employee?.name || '...',
          path: `/employees/${employeeId}`,
        },
        { title: 'Edytuj' },
      ]}
      actions={
        <Stack direction="row" alignItems="center" spacing={3}>
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            disabled={updateMutation.isPending || deleteMutation.isPending}
          >
            Anuluj
          </Button>
        </Stack>
      }
    >
      <Box sx={{ display: 'flex', flex: 1, width: '100%' }}>
        {renderContent()}
      </Box>
    </PageContainer>
  );
}
