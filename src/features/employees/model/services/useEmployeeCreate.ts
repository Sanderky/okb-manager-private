import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import useLoading from '@/shared/lib/useLoading';
import {
  useCreateEmployee as useCreateEmployeeMutation,
  type Employee,
} from '@/entities/employee';
import { toNumberOrNull } from '@/shared/lib/toNumberOrNull';
import { validate } from '../validation';
import type { EmployeeFormState, FormFieldValue } from '../types';

export const useCreateEmployee = () => {
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

  const [formState, setFormState] = React.useState<EmployeeFormState>({
    values: { status: true },
    errors: {},
  });

  const createMutation = useCreateEmployeeMutation();

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
        name: formState.values.name?.trim(),
        status: formState.values.status ?? true,
        isContractor: formState.values.isContractor ?? false,
        contractStartDate: formState.values.contractStartDate ?? null,
        a1StartDate: formState.values.a1StartDate ?? null,
        a1EndDate: formState.values.a1EndDate ?? null,
        contractEndDate: formState.values.contractIsPermanent
          ? null
          : (formState.values.contractEndDate ?? null),
        pesel: formState.values.pesel?.trim() ?? null,
        address: formState.values.address?.trim() ?? null,
        email: formState.values.email?.trim() ?? null,
        phone: formState.values.phone?.trim() ?? null,
        birthPlace: formState.values.birthPlace?.trim() ?? null,
        accountNumber: formState.values.accountNumber?.trim() ?? null,
        hourRate: toNumberOrNull(formState.values.hourRate) ?? null,
      };

      startActionLoading();
      try {
        const newEmployeeId = await createMutation.mutateAsync(payload);
        notifications.show('Pracownik został utworzony.', {
          severity: 'success',
          autoHideDuration: 5000,
        });
        navigate(`/employees/${newEmployeeId}`);
      } catch {
        notifications.show('Wystąpił błąd podczas tworzenia pracownika.', {
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

  return {
    formState,
    handleFieldChange,
    handleSubmit,
    actionLoading,
    registerFieldRef,
    isError: createMutation.isError,
  };
};
