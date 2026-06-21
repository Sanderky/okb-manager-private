import * as React from 'react';
import useLoading from '@/shared/lib/useLoading';
import {
  shouldBeInactive,
  useAddConstructionMutation,
  type Construction,
} from '@/entities/construction';
import {
  validate,
} from '@/features/constructions';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import { useNavigate } from 'react-router-dom';
import type { ConstructionFormState, FormFieldValue } from '../types';

export const useConstructionCreateService = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  const formRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  const registerFieldRef = (name: string, el: HTMLInputElement | null) => {
    formRefs.current[name] = el;
  };

  const [formState, setFormState] = React.useState<ConstructionFormState>({
    values: { status: true },
    errors: {},
  });

  const createMutation = useAddConstructionMutation();

  const handleFieldChange = React.useCallback(
    (name: keyof ConstructionFormState['values'], value: FormFieldValue) => {
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
      const changedValues: Partial<Omit<Construction, 'id'>> = {
        ...formState.values,
        name: formState.values.name?.trim(),
        location: formState.values.location?.trim(),
        contractorId: formState.values.contractorId,
        status: !shouldBeInactive(formState.values.endDate),
      };

      startActionLoading();
      try {
        const newConstructionId =
          await createMutation.mutateAsync(changedValues);
        notifications.show('Budowa została pomyślnie utworzona.', {
          severity: 'success',
          autoHideDuration: 5000,
        });
        navigate(`/constructions/${newConstructionId}`);
      } catch {
        notifications.show('Wystąpił błąd podczas tworzenia budowy.', {
          severity: 'error',
          autoHideDuration: 5000,
        });
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

  const handleCancel = React.useCallback(() => {
    navigate('/constructions');
  }, [navigate]);

  return {
    formState,
    handleFieldChange,
    handleSubmit,
    handleCancel,
    actionLoading,
    registerFieldRef,
    isError: createMutation.isError,
  };
};
