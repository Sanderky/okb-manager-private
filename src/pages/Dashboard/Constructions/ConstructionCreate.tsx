import * as React from 'react';
import { useNavigate } from 'react-router';
import ConstructionForm, {
  type ConstructionFormState,
  type FormFieldValue,
} from './ConstructionForm';
import PageContainer from '../../../components/PageContainer';
import type { Construction } from '../../../types';
import { createConstruction } from '../../../api/constructions';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { Box } from '@mui/material';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { validate } from './ConstructionHelpers';
import Loading from '../../../components/Loading';
import useLoading from '../../../hooks/useLoading';

export default function ConstructionCreate() {
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

  const [formState, setFormState] = React.useState<ConstructionFormState>({
    values: {},
    errors: {},
  });

  const createMutation = useMutation({
    mutationFn: (newConstruction: Partial<Construction>) =>
      createConstruction(newConstruction as Construction),
    onSuccess: (newConstructionId) => {
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
      notifications.show('Budowa została pomyślnie utworzona.', {
        severity: 'success',
        autoHideDuration: 5000,
      });
      navigate(`/constructions/${newConstructionId}`);
    },
    onError: (error: Error) => {
      console.error('Create construction error:', error);
      notifications.show('Wystąpił błąd podczas tworzenia budowy.', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    },
  });

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

      startActionLoading();
      try {
        await createMutation.mutateAsync(formState.values);
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
    return <Loading message="Trwa tworzenie nowej budowy..." />;
  }

  return (
    <PageContainer
      title={'Dodaj nową budowę'}
      breadcrumbs={[
        { title: 'Budowy', path: '/constructions' },
        { title: 'Nowa' },
      ]}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: { sm: '100%', md: '1790px' },
          boxShadow: 1,
        }}
        className="rounded-lg bg-white px-3 pt-4 pb-6 md:px-6"
      >
        <ConstructionForm
          formState={formState}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          isSubmitting={actionLoading}
          submitError={
            createMutation.isError
              ? 'Wystąpił błąd podczas tworzenia budowy.'
              : null
          }
          isEditForm={false}
          registerFieldRef={registerFieldRef}
        />
      </Box>
    </PageContainer>
  );
}
