import * as React from 'react';
import { useNavigate } from 'react-router';
import EmployeeForm, {
  type EmployeeFormState,
  type FormFieldValue,
} from './EmployeeForm';
import PageContainer from '../../../components/PageContainer';
import type { Employee, EmployeeAttachment } from '../../../types';
import { createEmployee } from '../../../api/employees';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { Box } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FileStateMap } from './EmployeeEdit';
import Loading from '../../../components/Loading';
import useLoading from '../../../hooks/useLoading';
import { validate } from './EmployeesHelpers';

export default function EmployeeCreate() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const queryClient = useQueryClient();
  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  const formRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  const registerFieldRef = (name: string, el: HTMLInputElement | null) => {
    formRefs.current[name] = el;
  };

  const [formState, setFormState] = React.useState<EmployeeFormState>({
    values: { status: true },
    errors: {},
  });

  const [files, setFiles] = React.useState<FileStateMap>({
    idAttachment: null,
    contractAttachment: null,
    a1Attachment: null,
  });

  const createMutation = useMutation({
    mutationFn: (newEmployee: Partial<Employee>) =>
      createEmployee(newEmployee as Employee),
    onSuccess: (newEmployeeId) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      notifications.show('Pracownik został utworzony.', {
        severity: 'success',
        autoHideDuration: 5000,
      });
      navigate(`/employees/${newEmployeeId}`);
    },
    onError: (error: Error) => {
      console.error('Create employee error:', error);
      notifications.show('Wystąpił błąd podczas tworzenia pracownika.', {
        severity: 'error',
        autoHideDuration: 5000,
      });
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

  const handleFileChange = (
    file: File | null,
    attachmentType: EmployeeAttachment
  ) => {
    setFiles((prevFiles) => ({
      ...prevFiles,
      [attachmentType]: file,
    }));
  };

  const handleSubmit = React.useCallback(
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

      const payload: Partial<Employee> = {
        ...formState.values,
        status: formState.values.status ?? true,
        isContractor: formState.values.isContractor ?? false,
        contractStartDate: formState.values.contractStartDate ?? null,
        a1StartDate: formState.values.a1StartDate ?? null,
        a1EndDate: formState.values.a1EndDate ?? null,
        contractEndDate: formState.values.contractISPermanent
          ? null
          : (formState.values.contractEndDate ?? null),
      };

      startActionLoading();
      try {
        await createMutation.mutateAsync(payload);
      } finally {
        stopActionLoading();
      }
    },
    [
      formState.values,
      createMutation,
      notifications,
      startActionLoading,
      stopActionLoading,
    ]
  );

  if (actionLoading) {
    return <Loading message="Trwa tworzenie nowego pracownika..." />;
  }

  return (
    <PageContainer
      title="Dodaj nowego pracownika"
      breadcrumbs={[
        { title: 'Pracownicy', path: '/employees' },
        { title: 'Nowy' },
      ]}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: { sm: '100%', md: '1790px' },
          boxShadow: 1,
        }}
        className="rounded-lg bg-white p-3 md:p-4"
      >
        <EmployeeForm
          formState={formState}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          isSubmitting={actionLoading}
          isEditForm={false}
          onFileChange={handleFileChange}
          filesState={files}
          registerFieldRef={registerFieldRef}
        />
      </Box>
    </PageContainer>
  );
}
