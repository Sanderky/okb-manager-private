import {
  shouldBeInactive,
  useConstruction,
  useDeleteMutation,
  useUpdateConstruction,
  type Construction,
} from '@/entities/construction';
import useLoading from '@/shared/lib/useLoading';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validate } from '../validation';
import { deleteFolderRecursive } from '@/shared/api/storage';
import type {
  ConstructionFormState,
  FormFieldValue,
  ValidationErrors,
} from '../types';

export const useEditConstruction = (constructionId: string) => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const { construction, isLoading, isError } = useConstruction(constructionId);

  const [formState, setFormState] = useState<ConstructionFormState>({
    values: {},
    errors: {},
  });

  useEffect(() => {
    if (construction) {
      setFormState({ values: construction, errors: {} });
    }
  }, [construction]);

  const updateMutation = useUpdateConstruction();
  const deleteMutation = useDeleteMutation();

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
    async (
      onValidationError?: (errors: ValidationErrors) => void,
      onSuccess?: () => void
    ) => {
      const validationErrors = validate(formState.values);
      if (Object.keys(validationErrors).length > 0) {
        setFormState((prev) => ({ ...prev, errors: validationErrors }));
        notifications.show('Proszę poprawić błędy w formularzu.', {
          severity: 'error',
          autoHideDuration: 3000,
        });
        onValidationError?.(validationErrors);
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

      startActionLoading();
      try {
        await updateMutation.mutateAsync({
          constructionId,
          payload: changedValues,
        });
        navigate(`/constructions/${constructionId}`);
        onSuccess?.();
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

  const handleDeleteConstruction = useCallback(
    async (onSuccess?: () => void, onError?: () => void) => {
      if (!construction) return;

      setIsDeleting(true);
      try {
        await deleteMutation.mutateAsync(constructionId);
        await deleteFolderRecursive(`/constructions/${construction.id}`);
        notifications.show('Budowa została pomyślnie usunięta.', {
          severity: 'info',
          autoHideDuration: 5000,
        });
        navigate('/constructions');
        onSuccess?.();
      } catch (error) {
        console.error('Delete employee error:', error);
        notifications.show('Wystąpił błąd podczas usuwania budowy.', {
          severity: 'error',
          autoHideDuration: 5000,
        });
        onError?.();
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteMutation, navigate, notifications, construction]
  );

  const handleCancel = useCallback(() => {
    navigate(`/constructions/${constructionId}`);
  }, [navigate]);

  const isFormLoading = actionLoading || isDeleting;

  return {
    isFormLoading,
    handleDeleteConstruction,
    handleFieldChange,
    handleSubmit,
    handleCancel,
    actionLoading,
    formState,
    construction,
    isError,
    isLoading,
    isDeleting: deleteMutation.isPending,
    isDeleteError: deleteMutation.isError,
    isUpdating: updateMutation.isPending,
    isUpdateError: updateMutation.isError,
  };
};
