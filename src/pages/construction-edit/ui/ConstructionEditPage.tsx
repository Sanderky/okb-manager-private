import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { useParams } from 'react-router';
import PageContainer from '@/shared/ui/PageContainer';
import { Chip, Stack } from '@mui/material';
import { Grid } from '@mui/system';
import Loading from '@/shared/ui/Loading';
import {
  ConstructionEdit,
  ConstructionEditProvider,
  useConstructionEditContext,
} from '@/features/constructions';

export const ConstructionEditPage = () => {
  const { constructionId } = useParams<{ constructionId: string }>();

  if (!constructionId) return null;

  return (
    <ConstructionEditProvider constructionId={constructionId}>
      <ConstructionEditPageContent />
    </ConstructionEditProvider>
  );
};

const ConstructionEditPageContent = () => {
  const {
    construction,
    constructionId,
    isLoading,
    actionLoading,
    isFormLoading,
    isError,
  } = useConstructionEditContext();

  const renderContent = () => {
    if (isLoading || actionLoading) {
      return <Loading message="Ładowanie danych budowy..." />;
    }

    if (isError) {
      return (
        <Grid
          container
          columns={12}
          alignItems={'flex-start'}
          className="w-full"
        >
          <Grid size={{ xs: 12 }} className="w-full">
            <Alert severity="error">
              Wystąpił błąd podczas ładowania danych budowy.
            </Alert>
          </Grid>
        </Grid>
      );
    }

    if (!construction) {
      return (
        <Grid
          container
          columns={12}
          alignItems={'flex-start'}
          className="w-full"
        >
          <Grid size={{ xs: 12 }} className="w-full">
            <Alert severity="warning">Nie znaleziono danych budowy.</Alert>
          </Grid>
        </Grid>
      );
    }

    return <ConstructionEdit />;
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
      actions={
        <Stack direction="row" alignItems="center">
          {!isError ? (
            <Chip
              label={
                isLoading || isFormLoading ? (
                  <Loading size={20} message="" />
                ) : construction?.status ? (
                  'W trakcie'
                ) : (
                  'Zakończona'
                )
              }
              className={
                isLoading || isFormLoading
                  ? 'bg-gray-300/50 text-gray-600'
                  : construction?.status
                    ? 'bg-blue-300/50 text-blue-600'
                    : 'bg-amber-300/50 text-amber-600'
              }
              variant="filled"
              sx={{
                borderRadius: 1,
                p: 0.5,
                ml: 2,
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            />
          ) : null}
        </Stack>
      }
    >
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          width: '100%',
          px: isError ? 0 : { xs: 0.5, sm: 2 },
          py: isError ? 0 : 2,
        }}
      >
        {renderContent()}
      </Box>
    </PageContainer>
  );
};
