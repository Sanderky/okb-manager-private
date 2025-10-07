import * as React from 'react';
import { useNavigate } from 'react-router';
import EmployeeForm, {
  type EmployeeFormState,
  type FormFieldValue,
} from './EmployeeForm';
import PageContainer from '../../../components/PageContainer';
import type { Employee } from '../../../types';
import { createEmployee } from '../../../api/employees';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { validate } from './EmployeeEditHelpers';
import dayjs from 'dayjs';

export default function EmployeeCreate() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const [formState, setFormState] = React.useState<EmployeeFormState>({
    values: { status: true },
    errors: {},
  });

  const createMutation = useMutation({
    mutationFn: (newEmployee: Partial<Employee>) =>
      createEmployee(newEmployee as Employee),
    onSuccess: (newEmployeeId) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      notifications.show('Pomyślnie utworzono pracownika.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      navigate(`/employees/${newEmployeeId}`);
    },
    onError: (error: Error) => {
      notifications.show(`Błąd: ${error.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
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

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const validationErrors = validate(formState.values);
      if (Object.keys(validationErrors).length > 0) {
        setFormState((prev) => ({ ...prev, errors: validationErrors }));
        return;
      }

      // mapowanie pól datowych
      const payload: Partial<Employee> = {
        ...formState.values,
        contractStartDate: formState.values.contractStartDate ?? null,
        a1StartDate: formState.values.a1StartDate ?? null,
        contractEndDate: formState.values.contractEndDate ?? null,
        a1EndDate: formState.values.a1EndDate ?? null,
      };
      console.log('createPayload', payload);
      createMutation.mutate(payload);
    },
    [formState.values, createMutation]
  );

  if (createMutation.isPending) {
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
          Trwa tworzenie nowego pracownika...
        </Typography>
      </Box>
    );
  }

  return (
    <PageContainer
      title={'Dodaj nowego pracownika'}
      breadcrumbs={[
        { title: 'Pracownicy', path: '/employees' },
        { title: 'Nowy' },
      ]}
    >
      <Box
        sx={{ width: '100%', maxWidth: { sm: '100%', md: '1790px' } }}
        className="border-lightGray rounded-lg border bg-white p-6"
      >
        <EmployeeForm
          formState={formState}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          isEditForm={false}
        />
      </Box>
    </PageContainer>
  );
}
