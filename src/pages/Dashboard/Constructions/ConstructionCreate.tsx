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
import { Box, CircularProgress, Typography } from '@mui/material';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { validate } from './ConstructionHelpers';

export default function ConstructionCreate() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const queryClient = useQueryClient();

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
          // firstErrorInput.focus();
        }
        return;
      }

      createMutation.mutate(formState.values);
    },
    [formState.values, createMutation, notifications]
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
          Trwa tworzenie nowej budowy...
        </Typography>
      </Box>
    );
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
        sx={{ width: '100%', maxWidth: { sm: '100%', md: '1790px' } }}
        className="border-darkGray rounded-lg border bg-white px-3 pt-4 pb-6 md:px-6"
      >
        <ConstructionForm
          formState={formState}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
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
