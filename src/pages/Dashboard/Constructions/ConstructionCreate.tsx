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

  const [formState, setFormState] = React.useState<ConstructionFormState>({
    values: {},
    errors: {},
  });

  const createMutation = useMutation({
    mutationFn: (newConstruction: Partial<Construction>) =>
      createConstruction(newConstruction as Construction),
    onSuccess: (newConstructionId) => {
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
      notifications.show('Pomyślnie utworzono budowę.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      navigate(`/constructions/${newConstructionId}`);
    },
    onError: (error: Error) => {
      notifications.show(`Błąd: ${error.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
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
        return;
      }

      createMutation.mutate(formState.values);
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
        className="border-lightGray rounded-lg border bg-white px-3 pt-4 pb-6 md:px-6"
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
        />
      </Box>
    </PageContainer>
  );
}
