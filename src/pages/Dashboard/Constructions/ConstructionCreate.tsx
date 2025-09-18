import * as React from 'react';
import { useNavigate } from 'react-router';
import ConstructionForm, {
  type ConstructionFormState,
  type FormFieldValue,
  validate,
} from './ConstructionForm';
import PageContainer from '../../../components/PageContainer';
import type { Construction } from '../../../types';
import { createConstruction } from '../../../api/constructions';
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

export default function ConstructionCreate() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const [formState, setFormState] = React.useState<ConstructionFormState>({
    values: { inProgress: true }, // Domyślnie zaznaczamy
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

  const handleBack = useCallback(() => {
    navigate('/constructions');
  }, [navigate]);

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
      actions={
        <Stack direction="row" alignItems="center" spacing={3}>
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Powrót
            <Box
              component="span"
              sx={{ display: { xs: 'none', md: 'inline' } }}
            >
              &nbsp;do listy
            </Box>
          </Button>
        </Stack>
      }
    >
      <Box
        sx={{ width: '100%', maxWidth: { sm: '100%', md: '1790px' } }}
        className="border-lightGray rounded-lg border bg-white px-6 py-4"
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

// import * as React from 'react';
// import { useNavigate } from 'react-router';
// import useNotifications from '../../../hooks/useNotifications/useNotifications';
// import ConstructionForm, {
//   type FormFieldValue,
//   type ConstructionFormState,
// } from './ConstructionForm';
// import PageContainer from '../../../components/PageContainer';
// import type { Construction } from '../../../types';
// import { useTranslation } from 'react-i18next';
// import { createConstruction } from '../../../api/constructions';
// import { useConstructions } from '../../../hooks/useConstructions';

// export default function ConstructionCreate() {
//   const navigate = useNavigate();
//   const { t } = useTranslation();
//   const {validate} = useConstructions()

//   const notifications = useNotifications();

//   const [formState, setFormState] = React.useState<ConstructionFormState>(() => ({
//     values: {},
//     errors: {},
//   }));
//   const formValues = formState.values;
//   const formErrors = formState.errors;

//   const setFormValues = React.useCallback(
//     (newFormValues: Partial<ConstructionFormState['values']>) => {
//       setFormState((previousState) => ({
//         ...previousState,
//         values: newFormValues,
//       }));
//     },
//     [],
//   );

//   const setFormErrors = React.useCallback(
//     (newFormErrors: Partial<ConstructionFormState['errors']>) => {
//       setFormState((previousState) => ({
//         ...previousState,
//         errors: newFormErrors,
//       }));
//     },
//     [],
//   );

//   const handleFormFieldChange = React.useCallback(
//     (name: keyof ConstructionFormState['values'], value: FormFieldValue) => {
//       const validateField = async (values: Partial<ConstructionFormState['values']>) => {
//         const { issues } = validate(values);
//         setFormErrors({
//           ...formErrors,
//           [name]: issues?.find((issue) => issue.path?.[0] === name)?.message,
//         });
//       };

//       const newFormValues = { ...formValues, [name]: value };

//       setFormValues(newFormValues);
//       validateField(newFormValues);
//     },
//     [formValues, formErrors, setFormErrors, setFormValues, validate],
//   );

//   const handleFormReset = React.useCallback(() => {
//     setFormValues({});
//   }, [setFormValues]);

//   const handleFormSubmit = React.useCallback(async () => {
//     const { issues } = validate(formValues);
//     if (issues && issues.length > 0) {
//       setFormErrors(
//         Object.fromEntries(issues.map((issue) => [issue.path?.[0], issue.message])),
//       );
//       return;
//     }
//     setFormErrors({});

//     try {
//       const constructionId = await createConstruction(formValues as Construction);
//       notifications.show(t('constructions.createSuccess'), {
//         severity: 'success',
//         autoHideDuration: 3000,
//       });

//       navigate(`/constructions/${constructionId}`);
//     } catch (createError) {
//       notifications.show(
//         `${t('constructions.createError')} ${(createError as Error).message}`,
//         {
//           severity: 'error',
//           autoHideDuration: 3000,
//         },
//       );
//       throw createError;
//     }
//   }, [formValues, navigate, notifications, setFormErrors, t, validate]);

//   return (
//     <PageContainer
//       title={t("constructions.newConstructionCreation")}
//       breadcrumbs={[{ title: t("constructions.constructions"), path: '/constructions' }, { title: t("constructions.newConstruction") }]}
//     >
//       <ConstructionForm
//         formState={formState}
//         onFieldChange={handleFormFieldChange}
//         onSubmit={handleFormSubmit}
//         onReset={handleFormReset}
//         submitButtonLabel={t("form.create")}
//       />
//     </PageContainer>
//   );
// }
