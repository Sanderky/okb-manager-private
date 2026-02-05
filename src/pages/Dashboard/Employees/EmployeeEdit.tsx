import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
} from './EmployeeForm';
import PageContainer from '../../../components/PageContainer';
import { AlertTitle, Chip, Stack, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { alpha, Grid } from '@mui/system';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import BaseDialog from '../../../components/BaseDialog';
import Loading from '../../../components/Loading';
import useLoading from '../../../hooks/useLoading';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import { useScroll } from '../../../context/ScrollContext';
import { useDialogs } from '../../../hooks/useDialogs/useDialogs';
import { toNumberOrNull, validate } from './EmployeesHelpers';
import { deleteFolderRecursive } from '../../../entities/files/model/api';

export default function EmployeeEdit() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notifications = useNotifications();
  const dialogs = useDialogs();

  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isUpdatingEmployeeStatus, setIsUpdatingEmployeeStatus] =
    useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const formRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const { scrollToTop } = useScroll();

  const registerFieldRef = (name: string, el: HTMLInputElement | null) => {
    formRefs.current[name] = el;
  };

  const {
    data: employee,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => getEmployee(employeeId!),
    refetchOnWindowFocus: false,
    enabled: !!employeeId,
  });

  const [formState, setFormState] = useState<EmployeeFormState>({
    values: {},
    errors: {},
  });

  useEffect(() => {
    if (employee) setFormState({ values: employee, errors: {} });
  }, [employee]);

  const updateMutation = useMutation({
    mutationFn: (values: Partial<Employee>) =>
      updateEmployee(employeeId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      notifications.show('Dane pracownika zostały zaktualizowane.', {
        severity: 'success',
        autoHideDuration: 5000,
      });
      navigate(`/employees/${employeeId}`);
      scrollToTop();
    },
    onError: (error: Error) => {
      console.error('Update employee error:', error);
      notifications.show(
        'Wystąpił błąd podczas aktualizacji danych pracownika.',
        { severity: 'error', autoHideDuration: 5000 }
      );
    },
  });

  const handleFieldChange = useCallback(
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

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const validationErrors = validate(formState.values);
      if (Object.keys(validationErrors).length > 0) {
        setFormState((prev) => ({ ...prev, errors: validationErrors }));
        notifications.show('Proszę poprawić błędy w formularzu.', {
          severity: 'error',
          autoHideDuration: 5000,
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

      startActionLoading();
      try {
        const updateData: Partial<Employee> = {
          ...formState.values,
          name: formState.values.name?.trim(),
          contractStartDate: formState.values.contractStartDate ?? null,
          a1StartDate: formState.values.a1StartDate ?? null,
          a1EndDate: formState.values.a1EndDate ?? null,
          contractEndDate: formState.values.contractIsPermanent
            ? null
            : (formState.values.contractEndDate ?? null),

          pesel: formState.values.pesel?.trim() || null,
          address: formState.values.address?.trim() || null,
          email: formState.values.email?.trim() || null,
          phone: formState.values.phone?.trim() || null,
          birthPlace: formState.values.birthPlace?.trim() || null,
          accountNumber: formState.values.accountNumber?.trim() || null,
          hourRate: toNumberOrNull(formState.values.hourRate) ?? null,
        };
        await updateMutation.mutateAsync(updateData);
      } catch (error) {
        console.error('Submit error:', error);
      } finally {
        stopActionLoading();
      }
    },
    [
      formState.values,
      updateMutation,
      startActionLoading,
      stopActionLoading,
      notifications,
    ]
  );

  const deleteMutation = useMutation({
    mutationFn: () => removeEmployee(employeeId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
  const handleDeleteClick = useCallback(() => {
    setDeleteConfirmation('');
    setDeleteDialogOpen(true);
  }, []);
  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeleteConfirmation('');
  }, []);

  const handleDeleteEmployee = useCallback(async () => {
    if (!employee) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync();
      await deleteFolderRecursive(`employees/${employee.id}`);
      setDeleteDialogOpen(false);
      notifications.show('Pracownik został usunięty.', { severity: 'info' });
      navigate('/employees');
    } catch (error) {
      console.error('Delete employee error:', error);
      notifications.show('Wystąpił błąd podczas usuwania pracownika.', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  }, [employee, deleteMutation, navigate, notifications]);

  const handleEmployeeStatus = useCallback(
    async (status: boolean) => {
      if (!employee) return;
      const confirmation = await dialogs.confirm(
        status
          ? `Czy na pewno chcesz aktywować pracownika?`
          : `Czy na pewno chcesz archiwizować pracownika?`,
        {
          title: status ? `Aktywowanie pracownika` : `Archiwizacja pracownika`,
          severity: status ? 'success' : 'warning',
          okText: 'Tak',
          cancelText: 'Anuluj',
        }
      );
      if (confirmation) {
        setIsUpdatingEmployeeStatus(true);
        try {
          await updateMutation.mutateAsync({ status: status });
          navigate(`/employees/${employeeId}`);
          scrollToTop();
        } catch (error) {
          console.error('Employee status update error:', error);
        } finally {
          setIsUpdatingEmployeeStatus(false);
        }
      }
    },
    [employee, employeeId, navigate, scrollToTop, updateMutation, dialogs]
  );

  const isFormLoading = actionLoading || isDeleting || isUpdatingEmployeeStatus;

  const renderContent = () => {
    if (isLoading) {
      return <Loading message="Ładowanie danych pracownika..." />;
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
              Wystąpił błąd podczas ładowania danych pracownika.
            </Alert>
          </Grid>
        </Grid>
      );
    }

    if (!employee) {
      return (
        <Grid
          container
          columns={12}
          alignItems={'flex-start'}
          className="w-full"
        >
          <Grid size={{ xs: 12 }} className="w-full">
            <Alert severity="warning">Nie znaleziono danych pracownika.</Alert>
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
                position: 'relative',
                // boxShadow: 1,
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              })}
              className="rounded-lg p-3 md:p-4"
            >
              <EmployeeForm
                formState={formState}
                onFieldChange={handleFieldChange}
                onSubmit={handleSubmit}
                isSubmitting={actionLoading}
                isEditForm={true}
                registerFieldRef={registerFieldRef}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, lg: 4, xl: 3 }}>
            {employee.status ? (
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
                    Archiwizuj pracownika
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Status pracownika zmienia się na "Nieaktywny".
                  </Typography>
                </div>
                <Button
                  variant="contained"
                  color={'warning'}
                  sx={{ minWidth: 120 }}
                  onClick={() => handleEmployeeStatus(false)}
                  loading={isFormLoading}
                  startIcon={<ArchiveIcon />}
                >
                  Archiwizuj
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
                    Aktywuj pracownika
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Status pracownika zmienia się na "Aktywny".
                  </Typography>
                </div>
                <Button
                  variant="contained"
                  color={'success'}
                  sx={{ minWidth: 120 }}
                  onClick={() => handleEmployeeStatus(true)}
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
              className="rounded-lg p-3"
              maxWidth={'400px'}
              sx={(theme) => ({
                border: `1px solid ${theme.palette.error.main}`,
                background: alpha(theme.palette.error.main, 0.1),
              })}
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
                onClick={handleDeleteClick}
                loading={isFormLoading || isDeleting}
                startIcon={<HighlightOffIcon />}
              >
                Usuń
              </Button>
            </Stack>
          </Grid>
        </Grid>

        <BaseDialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <WarningAmberIcon className="text-red-600" />
              <span>Usuwanie pracownika</span>
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
                onClick={handleDeleteEmployee}
                variant="contained"
                loading={isDeleting}
                color="error"
                disabled={
                  deleteConfirmation.toLocaleLowerCase() !==
                  employee.name.trim().toLocaleLowerCase()
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
              Czy na pewno chcesz usunąć <strong>{employee.name}</strong>?
            </Typography>
            <Typography variant="body1" className="text-gray-600">
              Pracownik zostanie usunięty z bazy danych łącznie ze wszytkimi
              jego plikami oraz powiązanymi informacjami.
            </Typography>
            <Alert severity="error">
              <AlertTitle>Uwaga!</AlertTitle>
              Tej operacji nie można cofnąć. Zamiast tego, proszę rozważyć
              archiwizację pracownika.
            </Alert>
            <Stack sx={{ mt: 2 }} direction={'column'} spacing={0.5}>
              <Typography variant="subtitle2">
                Aby usunąć pracownika, wprowadź poniżej jego pełną nazwę:
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

  const pageTitle = employee?.name || 'pracownika';

  return (
    <PageContainer
      title={`Edycja ${pageTitle}`}
      breadcrumbs={[
        { title: 'Pracownicy', path: '/employees' },
        { title: employee?.name || '...', path: `/employees/${employeeId}` },
        { title: 'Edytuj' },
      ]}
      actions={
        <Stack direction="row" alignItems="center">
          {!error ? (
            <Chip
              label={
                isLoading || isFormLoading ? (
                  <Loading size={20} message="" />
                ) : employee?.status ? (
                  'Aktywny'
                ) : (
                  'Nieaktywny'
                )
              }
              className={
                isLoading || isFormLoading
                  ? 'bg-gray-300/50 text-gray-600'
                  : employee?.status
                    ? 'bg-green-300/50 text-green-600'
                    : 'bg-red-300/50 text-red-600'
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
