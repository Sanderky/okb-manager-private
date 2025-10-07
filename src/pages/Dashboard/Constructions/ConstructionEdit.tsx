import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate, useParams } from 'react-router';
import {
  getConstruction,
  removeConstruction,
  updateConstruction,
} from '../../../api/constructions';
import type { Construction } from '../../../types';
import ConstructionForm, {
  type FormFieldValue,
  type ConstructionFormState,
  validate,
} from './ConstructionForm';
import PageContainer from '../../../components/PageContainer';
import { AlertTitle, Stack, Typography } from '@mui/material';

import { useCallback, useEffect } from 'react';
import { useDialogs } from '../../../hooks/useDialogs/useDialogs';
import { Grid } from '@mui/system';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import useNotifications from '../../../hooks/useNotifications/useNotifications';

export default function ConstructionEdit() {
  const { constructionId } = useParams<{ constructionId: string }>();
  const navigate = useNavigate();
  const dialogs = useDialogs();
  const queryClient = useQueryClient();
  const notifications = useNotifications();

  const {
    data: construction,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['construction', constructionId],
    queryFn: () => getConstruction(constructionId!),
    enabled: !!constructionId,
  });

  const [formState, setFormState] = React.useState<ConstructionFormState>({
    values: {},
    errors: {},
  });

  useEffect(() => {
    if (construction) {
      setFormState({ values: construction, errors: {} });
    }
  }, [construction]);

  const updateMutation = useMutation({
    mutationFn: (values: Partial<Construction>) =>
      updateConstruction(constructionId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['construction', constructionId],
      });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
      notifications.show('Zmiany zostały pomyślnie zapisane.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      navigate(`/constructions/${constructionId}`);
    },
    onError: (error: Error) => {
      notifications.show(`Błąd zapisu: ${error.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => removeConstruction(constructionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
      notifications.show('Budowa została usunięta.', {
        severity: 'info',
        autoHideDuration: 3000,
      });
      navigate('/constructions');
    },
    onError: (error: Error) => {
      notifications.show(`Błąd usuwania: ${error.message}`, {
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
      updateMutation.mutate(formState.values);
    },
    [formState.values, updateMutation]
  );

  const handleConstructionDelete = useCallback(async () => {
    if (!construction) return;

    const confirmed = await dialogs.confirm(
      <Stack
        direction="column"
        // sx={{ maxWidth: '100%', overflow: 'hidden' }}
        spacing={2}
      >
        <div>
          <Typography variant="body1" className="mb-1 text-gray-600" noWrap>
            Czy na pewno chcesz usunąć <strong>{construction.name}</strong>?
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            Ta akcja usunie budowę z systemu i wszystkie powiązane z nią dane.
          </Typography>
        </div>
        <Alert severity="error">
          <AlertTitle>Uwaga!</AlertTitle>
          Proszę zachować ostrożność, tej operacji nie można cofnąć.
        </Alert>
      </Stack>,
      {
        title: (
          <Stack direction="row" spacing={2} alignItems="center">
            <WarningAmberIcon className="text-red-600" />
            <Typography variant="h6" className="text-red-600">
              Usuwanie budowy
            </Typography>
          </Stack>
        ),
        severity: 'error',
        okText: 'Usuń',
        cancelText: 'Anuluj',
      }
    );

    if (confirmed) {
      deleteMutation.mutate();
    }
  }, [construction, dialogs, deleteMutation]);

  const renderContent = () => {
    if (isLoading || updateMutation.isPending || deleteMutation.isPending) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            py: 4,
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error">{(error as Error).message}</Alert>;
    }

    if (!construction) {
      return <Alert severity="warning">Nie znaleziono danych budowy.</Alert>;
    }

    return (
      <Grid container columns={12} spacing={{ xs: 3, lg: 2 }}>
        <Grid size={{ xs: 12, lg: 8, xl: 9 }}>
          <Box
            sx={{ width: '100%', maxWidth: { sm: '100%', md: '1790px' } }}
            className="border-lightGray rounded-lg border bg-white px-3 pt-4 pb-6 md:px-6"
          >
            <ConstructionForm
              formState={formState}
              onFieldChange={handleFieldChange}
              onSubmit={handleSubmit}
              isSubmitting={updateMutation.isPending}
              submitError={
                updateMutation.isError ? 'Wystąpił błąd podczas zapisu.' : null
              }
              isEditForm={true}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, lg: 4, xl: 3 }}>
          <Stack
            direction={{ xs: 'column' }}
            justifyContent={{ xs: 'flex-start' }}
            alignItems={{ xs: 'flex-start' }}
            spacing={{ xs: 1, xl: 2 }}
            className="rounded-lg border border-red-500/25 bg-red-600/5! p-3"
          >
            <div>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Usuń budowę
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Trwale usuwa budowę z bazy danych. Tej operacji nie można
                cofnąć.
              </Typography>
            </div>
            <Button
              variant="contained"
              color="error"
              sx={{ minWidth: 120 }}
              onClick={handleConstructionDelete}
              disabled={deleteMutation.isPending}
              startIcon={<HighlightOffIcon />}
            >
              {deleteMutation.isPending ? 'Usuwanie...' : 'Usuń'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    );
  };

  const pageTitle = construction?.name || 'budowy';

  return (
    <PageContainer
      title={`Edycja ${pageTitle}`}
      breadcrumbs={[
        { title: 'Budowy', path: '/constructions' },
        {
          title: construction?.name || '...',
          path: `/constructions/${constructionId}`,
        },
        { title: 'Edytuj' },
      ]}
    >
      <Box sx={{ display: 'flex', flex: 1, width: '100%' }}>
        {renderContent()}
      </Box>
    </PageContainer>
  );
}

// import * as React from 'react';
// import Alert from '@mui/material/Alert';
// import Box from '@mui/material/Box';
// import Button from '@mui/material/Button';
// import CircularProgress from '@mui/material/CircularProgress';
// import { useNavigate, useParams } from 'react-router';
// import {
//   getConstruction,
//   removeConstruction,
//   updateConstruction,
// } from '../../../api/constructions';
// import type { Construction } from '../../../types';
// import ConstructionForm, {
//   type FormFieldValue,
//   type ConstructionFormState,
//   validate,
// } from './ConstructionForm';
// import PageContainer from '../../../components/PageContainer';
// import { AlertTitle, Stack, Typography } from '@mui/material';

// import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// import { useCallback, useState } from 'react';
// import { useDialogs } from '../../../hooks/useDialogs/useDialogs';
// import { Grid } from '@mui/system';

// import WarningAmberIcon from '@mui/icons-material/WarningAmber';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// function ConstructionEditForm({
//   construction,
//   onSubmit,
//   isSubmitting,
//   submitError,
// }: {
//   construction: Construction;
//   onSubmit: (
//     formValues: Partial<ConstructionFormState['values']>
//   ) => Promise<void>;
//   isSubmitting: boolean;
//   submitError: string | null;
// }) {
//   const [formState, setFormState] = React.useState<ConstructionFormState>(
//     () => ({
//       values: construction,
//       errors: {},
//     })
//   );

//   const handleFormFieldChange = React.useCallback(
//     (name: keyof ConstructionFormState['values'], value: FormFieldValue) => {
//       setFormState((prevState) => ({
//         ...prevState,
//         values: { ...prevState.values, [name]: value },
//         errors: { ...prevState.errors, [name]: undefined },
//       }));
//     },
//     []
//   );

//   const handleFormReset = React.useCallback(() => {
//     setFormState({ values: construction, errors: {} });
//   }, [construction]);

//   const handleFormSubmit = React.useCallback(
//     async (event: React.FormEvent<HTMLFormElement>) => {
//       event.preventDefault();
//       const validationErrors = validate(formState.values);
//       if (Object.keys(validationErrors).length > 0) {
//         setFormState((prev) => ({ ...prev, errors: validationErrors }));
//         return;
//       }
//       await onSubmit(formState.values);
//     },
//     [onSubmit, formState.values]
//   );

//   return (
//     <ConstructionForm
//       formState={formState}
//       onFieldChange={handleFormFieldChange}
//       onSubmit={handleFormSubmit}
//       onReset={handleFormReset}
//       isSubmitting={isSubmitting}
//       submitError={submitError}
//       isEditForm={true}
//     />
//   );
// }

// export default function ConstructionEdit() {
//   const { constructionId } = useParams<{ constructionId: string }>();
//   const navigate = useNavigate();
//   const dialogs = useDialogs();
//   const queryClient = useQueryClient();

//   const {
//     data: construction,
//     isLoading,
//     error,
//   } = useQuery({
//     queryKey: ['construction', constructionId],
//     queryFn: () => getConstruction(constructionId!),
//     enabled: !!constructionId,
//   });

//   const updateMutation = useMutation({
//     mutationFn: (values: Partial<Construction>) =>
//       updateConstruction(constructionId!, values),
//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ['construction', constructionId],
//       });
//       queryClient.invalidateQueries({ queryKey: ['constructions'] });
//       navigate(`/constructions/${constructionId}`);
//     },
//   });

//   const deleteMutation = useMutation({
//     mutationFn: () => removeConstruction(constructionId!),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['constructions'] });
//       navigate('/constructions');
//     },
//   });

//   const handleSubmit = async (
//     formValues: Partial<ConstructionFormState['values']>
//   ) => {
//     await updateMutation.mutateAsync(formValues);
//   };

//   const handleConstructionDelete = useCallback(async () => {
//     if (!construction) return;

//     const confirmed = await dialogs.confirm(
//       <Stack direction="column" spacing={2}>
//         <div>
//           <Typography variant="body1" className="mb-1 text-gray-600">
//             Czy na pewno chcesz usunąć <strong>{construction.name}</strong>?
//           </Typography>
//           <Typography variant="body1" className="text-gray-600">
//             Ta akcja usunie budowę z systemu i wszystkie powiązane z nią dane.
//           </Typography>
//         </div>
//         <Alert severity="error">
//           <AlertTitle>Uwaga!</AlertTitle>
//           Proszę zachować ostrożność, tej operacji nie można cofnąć.
//         </Alert>
//       </Stack>,
//       {
//         title: (
//           <Stack direction="row" spacing={2} alignItems="center">
//             <WarningAmberIcon className="text-red-600" />
//             <Typography variant="h6" className="text-red-600">
//               Usuwanie budowy
//             </Typography>
//           </Stack>
//         ),
//         severity: 'error',
//         okText: 'Usuń',
//         cancelText: 'Anuluj',
//       }
//     );

//     if (confirmed) {
//       deleteMutation.mutate();
//     }
//   }, [construction, dialogs, deleteMutation]);

//   const handleBack = React.useCallback(() => {
//     navigate(`/constructions/${constructionId}`);
//   }, [navigate, constructionId]);

//   const renderEdit = React.useMemo(() => {
//     if (isLoading || deleteMutation.isPending || updateMutation.isPending) {
//       return (
//         <Box
//           sx={{
//             flex: 1,
//             display: 'flex',
//             flexDirection: 'column',
//             alignItems: 'center',
//             justifyContent: 'center',
//             width: '100%',
//             m: 1,
//           }}
//         >
//           <CircularProgress />
//           <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
//             {(() => {
//               if (deleteMutation.isPending) {
//                 return 'Trwa usuwanie budowy...';
//               } else if (updateMutation.isPending) {
//                 return 'Trwa aktualizacja budowy...';
//               } else {
//                 return 'Ładowanie danych...';
//               }
//             })()}
//           </Typography>
//         </Box>
//       );
//     }

//     if (error) {
//       return <Alert severity="error">{(error as Error).message}</Alert>;
//     }

//     return construction ? (
//       <Grid container columns={12} spacing={2}>
//         <Grid size={{ xs: 12, lg: 9 }}>
//           <Box
//             sx={{ width: '100%', maxWidth: { sm: '100%', md: '1790px' } }}
//             className="border-lightGray rounded-lg border bg-white p-6"
//           >
//             <ConstructionEditForm
//               construction={construction}
//               onSubmit={handleSubmit}
//               isSubmitting={updateMutation.isPending}
//               submitError={
//                 updateMutation.isError ? 'Wystąpił błąd podczas zapisu.' : null
//               }
//             />
//           </Box>
//         </Grid>
//         <Grid size={{ xs: 12, lg: 3 }}>
//           <Stack
//             direction={{ xs: 'column' }}
//             justifyContent={{ xs: 'flex-start' }}
//             alignItems={{ xs: 'flex-start' }}
//             spacing={{ xs: 1, xl: 2 }}
//             sx={{ width: { xs: '100%', md: 'auto' } }}
//             className="rounded-lg border border-red-500/25 bg-red-600/5! p-3"
//           >
//             <div>
//               <Typography variant="body1" sx={{ fontWeight: 600 }}>
//                 Usuń budowę
//               </Typography>
//               <Typography variant="body2" sx={{ color: 'text.secondary' }}>
//                 Trwale usuwa budowę z bazy danych.
//               </Typography>
//             </div>
//             <Button
//               variant="contained"
//               color="error"
//               sx={{ minWidth: 120 }}
//               onClick={handleConstructionDelete}
//               disabled={deleteMutation.isPending}
//             >
//               Usuń
//             </Button>
//           </Stack>
//         </Grid>
//       </Grid>
//     ) : (
//       <Alert severity="warning">Nie znaleziono danych budowy.</Alert>
//     );
//   }, [
//     isLoading,
//     error,
//     construction,
//     handleSubmit,
//     handleConstructionDelete,
//     deleteMutation.isPending,
//     updateMutation.isPending,
//     updateMutation.isError,
//   ]);

//   const pageTitle = construction?.name || 'budowy';

//   return (
//     <PageContainer
//       title={`Edycja ${pageTitle}`}
//       breadcrumbs={[
//         { title: 'Budowy', path: '/constructions' },
//         {
//           title: construction?.name || '...',
//           path: `/constructions/${constructionId}`,
//         },
//         { title: 'Edytuj' },
//       ]}
//       actions={
//         <Stack direction="row" alignItems="center" spacing={3}>
//           <Button
//             variant="outlined"
//             onClick={handleBack}
//             startIcon={<ArrowBackIcon />}
//           >
//             Powrót
//           </Button>
//         </Stack>
//       }
//     >
//       <Box sx={{ display: 'flex', flex: 1, width: '100%' }}>{renderEdit}</Box>
//     </PageContainer>
//   );
// }
