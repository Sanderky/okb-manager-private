import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import useLoading from '@/shared/lib/useLoading';
import { useScroll } from '@/shared/lib/ScrollContext';
import { useDialogs } from '@/shared/ui/dialogs/useDialogs';
import {
  EmployeeApi,
  useDeleteEmployee,
  useUpdateEmployee,
  type Employee,
} from '@/entities/employee';
import { toNumberOrNull } from '@/shared/lib/toNumberOrNull';
import { deleteFolderRecursive } from '@/shared/api/storage';
import type { EmployeeFormState, FormFieldValue } from '../types';
import { validate } from '../validation';

export const useEditEmployee = (employeeId: string) => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const dialogs = useDialogs();
  const { scrollToTop } = useScroll();

  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingEmployeeStatus, setIsUpdatingEmployeeStatus] =
    useState(false);

  const {
    data: employee,
    isLoading,
    error: isError,
  } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => EmployeeApi.getEmployee(employeeId!),
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

  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

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
    async (
      onValidationError?: (errors: Record<string, string>) => void,
      onSuccess?: () => void
    ) => {
      const validationErrors = validate(formState.values);
      if (Object.keys(validationErrors).length > 0) {
        setFormState((prev) => ({ ...prev, errors: validationErrors }));
        notifications.show('Proszę poprawić błędy w formularzu.', {
          severity: 'error',
          autoHideDuration: 5000,
        });
        onValidationError?.(validationErrors);
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
        await updateMutation.mutateAsync({
          employeeId,
          payload: updateData,
        });
        notifications.show('Dane pracownika zostały zaktualizowane.', {
          severity: 'success',
          autoHideDuration: 5000,
        });
        navigate(`/employees/${employeeId}`);
        scrollToTop();
        onSuccess?.();
      } catch (error) {
        console.error('Submit error:', error);
        notifications.show(
          'Wystąpił błąd podczas aktualizacji danych pracownika.',
          { severity: 'error', autoHideDuration: 5000 }
        );
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
      navigate,
      employeeId,
      scrollToTop,
    ]
  );

  const handleDeleteEmployee = useCallback(
    async (onSuccess?: () => void, onError?: () => void) => {
      if (!employee) return;
      setIsDeleting(true);
      try {
        await deleteMutation.mutateAsync(employeeId);
        await deleteFolderRecursive(`employees/${employee.id}`);
        notifications.show('Pracownik został usunięty.', { severity: 'info' });
        navigate('/employees');
        onSuccess?.();
      } catch (error) {
        console.error('Delete employee error:', error);
        notifications.show('Wystąpił błąd podczas usuwania pracownika.', {
          severity: 'error',
          autoHideDuration: 5000,
        });
        onError?.();
      } finally {
        setIsDeleting(false);
      }
    },
    [employee, deleteMutation, navigate, notifications]
  );

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
          await updateMutation.mutateAsync({
            employeeId,
            payload: { status: status },
          });
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

  const handleCancel = useCallback(() => {
    navigate(`/employees/${employeeId}`);
  }, [navigate]);

  const isFormLoading = actionLoading || isDeleting || isUpdatingEmployeeStatus;

  return {
    employee,
    employeeId,
    isLoading,
    isError,
    actionLoading,
    isFormLoading,
    isDeleting,
    formState,
    handleFieldChange,
    handleSubmit,
    handleDeleteEmployee,
    handleEmployeeStatus,
    handleCancel,
  };
};
