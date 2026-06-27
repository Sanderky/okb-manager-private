import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { useParams } from 'react-router-dom';
import PageContainer from '@/shared/ui/PageContainer';
import { Chip, Stack } from '@mui/material';
import { Grid } from '@mui/system';
import Loading from '@/shared/ui/Loading';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('employees');

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
      return <Loading message={t('pages.edit.loading')} />;
    }

    if (isError) {
      return (
        <Grid container columns={12} alignItems="flex-start" className="w-full">
          <Grid size={{ xs: 12 }} className="w-full">
            <Alert severity="error">{t('pages.edit.loadError')}</Alert>
          </Grid>
        </Grid>
      );
    }

    if (!employee) {
      return (
        <Grid container columns={12} alignItems="flex-start" className="w-full">
          <Grid size={{ xs: 12 }} className="w-full">
            <Alert severity="warning">{t('pages.edit.notFound')}</Alert>
          </Grid>
        </Grid>
      );
    }

    return <EmployeeEdit />;
  };

  const pageTitle = employee?.name || t('pages.edit.fallbackName');

  return (
    <PageContainer
      title={t('pages.edit.title', { name: pageTitle })}
      breadcrumbs={[
        { title: t('pages.breadcrumbs.employees'), path: '/employees' },
        { title: employee?.name || '...', path: `/employees/${employeeId}` },
        { title: t('pages.breadcrumbs.edit') },
      ]}
      actions={
        <Stack direction="row" alignItems="center">
          {!isError ? (
            <Chip
              label={
                isLoading || isFormLoading ? (
                  <Loading size={20} message="" />
                ) : employee?.status ? (
                  t('list.status.active')
                ) : (
                  t('list.status.inactive')
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
