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
import type { Employee, EmployeeAttachment } from '../../../types';
import EmployeeForm, {
  type FormFieldValue,
  type EmployeeFormState,
} from './EmployeeForm';
import PageContainer from '../../../components/PageContainer';
import { AlertTitle, Chip, Stack, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Grid } from '@mui/system';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import useEmployeeAttachment from './useAttachment';
import { validate } from './EmployeeEditHelpers';
import BaseDialog from '../../../components/BaseDialog';
import { deleteFolderRecursive } from '../../../components/fileBrowser/FileBrowserHelpers';
import Loading from '../../../components/Loading';
import useLoading from '../../../hooks/useLoading';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import { removeEmployeeWorkHours } from '../../../api/hours';
import { removeEmployeeVacations } from '../../../api/vacations';
import { removeEmployeeSchedules } from '../../../api/schedules';

export type FileStateMap = {
  [K in EmployeeAttachment]: File | null;
};

const EmployeeAttachments: EmployeeAttachment[] = [
  'idAttachment',
  'contractAttachment',
  'a1Attachment',
];

export default function EmployeeEdit() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notifications = useNotifications();
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
    enabled: false,
  });

  const [formState, setFormState] = useState<EmployeeFormState>({
    values: {},
    errors: {},
  });

  const [files, setFiles] = useState<FileStateMap>({
    idAttachment: null,
    contractAttachment: null,
    a1Attachment: null,
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
      notifications.show('Dane pracownika zostały zaktualizowane.', {
        severity: 'success',
        autoHideDuration: 5000,
      });
    },
    onError: (error: Error) => {
      console.error('Update employee error:', error);
      notifications.show(
        'Wystąpił błąd podczas aktualizacji danych pracownika.',
        {
          severity: 'error',
          autoHideDuration: 5000,
        }
      );
    },
  });

  const handleFileChange = (
    file: File | null,
    attachmentType: EmployeeAttachment
  ) => {
    setFiles((prevFiles) => ({
      ...prevFiles,
      [attachmentType]: file,
    }));
  };

  const deleteMutation = useMutation({
    mutationFn: () => removeEmployee(employeeId!),
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

  const {
    handleDeleteAttachment,
    handleUploadAttachment,
    loading: attachmentLoading,
  } = useEmployeeAttachment(employee);

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

      try {
        const attachmentResults = await Promise.all(
          EmployeeAttachments.map(async (attachmentType) => {
            const file = files[attachmentType];
            const currentValue = formState.values[attachmentType] ?? null;
            const employeeValue = employee?.[attachmentType] ?? null;
            const type = attachmentType;

            if (file) {
              if (employeeValue) await handleDeleteAttachment(type);
              return await handleUploadAttachment(file, type);
            } else if (!currentValue && employeeValue) {
              await handleDeleteAttachment(type);
              return null;
            }
            return currentValue ?? null;
          })
        );

        const updateData: Partial<Employee> = {
          ...formState.values,
          idAttachment:
            attachmentResults.find(
              (a) => a?.attachmentType === 'idAttachment'
            ) ?? null,
          contractAttachment:
            attachmentResults.find(
              (a) => a?.attachmentType === 'contractAttachment'
            ) ?? null,
          a1Attachment:
            attachmentResults.find(
              (a) => a?.attachmentType === 'a1Attachment'
            ) ?? null,
          contractStartDate: formState.values.contractStartDate ?? null,
          a1StartDate: formState.values.a1StartDate ?? null,
          a1EndDate: formState.values.a1EndDate ?? null,
          contractEndDate: formState.values.contractISPermanent
            ? null
            : (formState.values.contractEndDate ?? null),
        };

        startActionLoading();
        await updateMutation.mutateAsync(updateData);
        navigate(`/employees/${employeeId}`);
      } catch (error) {
        console.error('Submit error:', error);
      } finally {
        stopActionLoading();
      }
    },
    [
      formState.values,
      updateMutation,
      handleDeleteAttachment,
      handleUploadAttachment,
      employeeId,
      navigate,
      notifications,
      files,
      employee,
      startActionLoading,
      stopActionLoading,
    ]
  );

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteEmployee = useCallback(async () => {
    if (!employee) return;

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync();
      await Promise.all([
        removeEmployeeWorkHours(employee.id),
        removeEmployeeVacations(employee.id),
        removeEmployeeSchedules(employee.id),
      ]);
      await deleteFolderRecursive(`/employees/${employee.id}`);
      setDeleteDialogOpen(false);
      notifications.show('Pracownik został usunięty.', {
        severity: 'info',
        autoHideDuration: 5000,
      });
      navigate('/employees');
    } catch (error) {
      setDeleteDialogOpen(false);
      console.error('Delete employee error:', error);
      notifications.show('Wystąpił błąd podczas usuwania pracownika.', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  }, [employee, deleteMutation, navigate, notifications]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
  }, []);

  const handleEmployeeStatus = useCallback(
    async (status: boolean) => {
      if (!employee) return;

      setIsUpdatingEmployeeStatus(true);
      try {
        await updateMutation.mutateAsync({ status: status });
        navigate(`/employees/${employeeId}`);
      } catch (error) {
        console.error('Employee status update error:', error);
      } finally {
        setIsUpdatingEmployeeStatus(false);
      }
    },
    [employee, employeeId, navigate, updateMutation]
  );

  const isFormLoading =
    actionLoading ||
    attachmentLoading !== false ||
    isDeleting ||
    isUpdatingEmployeeStatus;

  const renderContent = () => {
    if (isLoading) {
      return <Loading message="Ładowanie danych pracownika..." />;
    }

    if (error) {
      return (
        <Alert severity="error">
          Wystąpił błąd podczas ładowania danych pracownika.
        </Alert>
      );
    }

    if (!employee) {
      return (
        <Alert severity="warning">Nie znaleziono danych pracownika.</Alert>
      );
    }

    return (
      <>
        <Grid container columns={12} spacing={{ xs: 3, lg: 2 }}>
          <Grid size={{ xs: 12, lg: 8, xl: 9 }}>
            <Box
              sx={{
                width: '100%',
                maxWidth: { sm: '100%', md: '1790px' },
                position: 'relative',
                boxShadow: 1,
              }}
              className="rounded-lg bg-white px-3 pt-4 pb-6 md:px-6"
            >
              <EmployeeForm
                onFileChange={handleFileChange}
                filesState={files}
                formState={formState}
                onFieldChange={handleFieldChange}
                onSubmit={handleSubmit}
                isSubmitting={actionLoading}
                isFileLoading={attachmentLoading}
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
                className="mb-4 rounded-lg border border-amber-500/25 bg-amber-600/5! p-3"
                maxWidth={'400px'}
              >
                <div>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Archiwizuj pracownika
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Status pracownika zmienia się na nieaktywny.
                  </Typography>
                </div>
                <Button
                  variant="contained"
                  color={'warning'}
                  sx={{ minWidth: 120 }}
                  onClick={() => handleEmployeeStatus(false)}
                  disabled={isFormLoading}
                  startIcon={<ArchiveIcon />}
                >
                  {isUpdatingEmployeeStatus
                    ? 'Archiwizowanie...'
                    : 'Archiwizuj'}
                </Button>
              </Stack>
            ) : (
              <Stack
                direction={{ xs: 'column' }}
                justifyContent={{ xs: 'flex-start' }}
                alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                spacing={{ xs: 1, xl: 2 }}
                className="mb-4 rounded-lg border border-green-500/25 bg-green-600/5! p-3"
                maxWidth={'400px'}
              >
                <div>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Aktywuj pracownika
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Status pracownika zmienia się na aktywny.
                  </Typography>
                </div>
                <Button
                  variant="contained"
                  color={'success'}
                  sx={{ minWidth: 120 }}
                  onClick={() => handleEmployeeStatus(true)}
                  disabled={isFormLoading}
                  startIcon={<UnarchiveIcon />}
                >
                  {isUpdatingEmployeeStatus ? 'Aktywacja...' : 'Aktywuj'}
                </Button>
              </Stack>
            )}
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
                disabled={isFormLoading}
                startIcon={<HighlightOffIcon />}
              >
                {isDeleting ? 'Usuwanie...' : 'Usuń'}
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
                color="primary"
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
            isLoading || isFormLoading ? (
              <Loading size={24} message="" />
            ) : (
              <Chip
                label={employee?.status ? 'Aktywny' : 'Nieaktywny'}
                className={
                  employee?.status
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
            )
          ) : null}
        </Stack>
      }
    >
      <Box sx={{ display: 'flex', flex: 1, width: '100%' }}>
        {renderContent()}
      </Box>
    </PageContainer>
  );
}
