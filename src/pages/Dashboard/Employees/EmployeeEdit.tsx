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
import type { Employee, EmployeeAttachment } from '../../../types';
import EmployeeForm, {
  type FormFieldValue,
  type EmployeeFormState,
} from './EmployeeForm';
import PageContainer from '../../../components/PageContainer';
import { AlertTitle, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Grid } from '@mui/system';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import useEmployeeAttachment from './useAttachment';
import { validate } from './EmployeeEditHelpers';
import { ConfirmationDialog } from '../../../components/BaseDialog';
import { deleteFolderRecursive } from '../../../components/fileBrowser/FileBrowserHelpers';

export type FileStateMap = {
  [K in EmployeeAttachment]: File | null;
};

export default function EmployeeEdit() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notifications = useNotifications();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    enabled: !!employeeId,
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
          // firstErrorInput.focus();
        }

        return;
      }

      try {
        const attachmentsConfig = [
          {
            file: files.contractAttachment,
            currentValue: formState.values.contractAttachment ?? null,
            employeeValue: employee?.contractAttachment ?? null,
            type: 'contractAttachment' as const,
          },
          {
            file: files.a1Attachment,
            currentValue: formState.values.a1Attachment ?? null,
            employeeValue: employee?.a1Attachment ?? null,
            type: 'a1Attachment' as const,
          },
        ];

        const attachmentResults = await Promise.all(
          attachmentsConfig.map(
            async ({ file, currentValue, employeeValue, type }) => {
              if (file) {
                if (employeeValue) await handleDeleteAttachment(type);
                return await handleUploadAttachment(file, type);
              } else if (!currentValue && employeeValue) {
                await handleDeleteAttachment(type);
                return null;
              }
              return currentValue ?? null;
            }
          )
        );

        const updateData: Partial<Employee> = {
          ...formState.values,
          contractAttachment: attachmentResults[0],
          a1Attachment: attachmentResults[1],
          contractStartDate: formState.values.contractStartDate ?? null,
          a1StartDate: formState.values.a1StartDate ?? null,
          a1EndDate: formState.values.a1EndDate ?? null,
          contractEndDate: formState.values.contractISPermanent
            ? null
            : (formState.values.contractEndDate ?? null),
        };

        setIsSubmitting(true);
        console.log('updateData', updateData);

        await updateMutation.mutateAsync(updateData);

        navigate(`/employees/${employeeId}`);
      } catch (error) {
        // Error handling is done in mutation
        console.error('Error:', error);
      } finally {
        setIsSubmitting(false);
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

  const isFormLoading =
    attachmentLoading !== false || isSubmitting || isDeleting;

  const renderContent = () => {
    if (isLoading) {
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
                isSubmitting={isSubmitting}
                isFileLoading={attachmentLoading}
                isEditForm={true}
                registerFieldRef={registerFieldRef}
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

        <ConfirmationDialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteEmployee}
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <WarningAmberIcon className="text-red-600" />
              <span>Usuwanie pracownika</span>
            </Stack>
          }
          message={
            <Stack direction="column" spacing={2}>
              <Typography variant="body1" className="text-gray-600">
                Czy na pewno chcesz usunąć <strong>{employee.name}</strong>?
              </Typography>
              <Typography variant="body1" className="text-gray-600">
                Pracownik zostanie usunięty z bazy danych łącznie ze wszytkimi
                jego plikami.
              </Typography>
              <Alert severity="error">
                <AlertTitle>Uwaga!</AlertTitle>
                Proszę zachować ostrożność, tej operacji nie można cofnąć.
              </Alert>
            </Stack>
          }
          confirmText="Usuń"
          cancelText="Anuluj"
          confirmColor="error"
          loading={isDeleting}
        />
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
    >
      <Box sx={{ display: 'flex', flex: 1, width: '100%' }}>
        {renderContent()}
      </Box>
    </PageContainer>
  );
}
