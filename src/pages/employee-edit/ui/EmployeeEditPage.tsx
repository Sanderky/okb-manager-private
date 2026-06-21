import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { useParams } from 'react-router-dom';
import PageContainer from '@/shared/ui/PageContainer';
import { Chip, Stack } from '@mui/material';
import { Grid } from '@mui/system';
import Loading from '@/shared/ui/Loading';
import {
  EmployeeEdit,
  EmployeeEditProvider,
  useEmployeeEditContext,
} from '@/features/employees';

export const EmployeeEditPage = () => {
  const { employeeId } = useParams<{ employeeId: string }>();

  if (!employeeId) return null;

  return (
    <EmployeeEditProvider employeeId={employeeId}>
      <EmployeeEditPageContent />
    </EmployeeEditProvider>
  );
};

const EmployeeEditPageContent = () => {
  const {
    employee,
    employeeId,
    isLoading,
    actionLoading,
    isFormLoading,
    isError,
  } = useEmployeeEditContext();

  const renderContent = () => {
    if (isLoading || actionLoading) {
      return <Loading message="Ładowanie danych pracownika..." />;
    }

    if (isError) {
      return (
        <Grid container columns={12} alignItems="flex-start" className="w-full">
          <Grid size={{ xs: 12 }} className="w-full">
            <Alert severity="error">
              Wystąpił błąd podczas ładowania danych pracownika.
            </Alert>
          </Grid>
        </Grid>
      );
    }

    if (!employee) {
      return (
        <Grid container columns={12} alignItems="flex-start" className="w-full">
          <Grid size={{ xs: 12 }} className="w-full">
            <Alert severity="warning">Nie znaleziono danych pracownika.</Alert>
          </Grid>
        </Grid>
      );
    }

    return <EmployeeEdit />;
  };

  const pageTitle = employee?.name || 'pracownika';

  return (
    <PageContainer
      title={`Edycja ${pageTitle}`}
      breadcrumbs={[
        { title: 'Pracownicy', path: '/employees' },
        { title: employee?.name || '...', path: `/employees/${employeeId}` },
        { title: 'Edytuj' },
      ]}
      actions={
        <Stack direction="row" alignItems="center">
          {!isError ? (
            <Chip
              label={
                isLoading || isFormLoading ? (
                  <Loading size={20} message="" />
                ) : employee?.status ? (
                  'Aktywny'
                ) : (
                  'Nieaktywny'
                )
              }
              className={
                isLoading || isFormLoading
                  ? 'bg-gray-300/50 text-gray-600'
                  : employee?.status
                    ? 'bg-green-300/50 text-green-600'
                    : 'bg-red-300/50 text-red-600'
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
