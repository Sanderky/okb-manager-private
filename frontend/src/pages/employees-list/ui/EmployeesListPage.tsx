import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router';
import PageContainer from '@/shared/ui/PageContainer';
import { useEmployees } from '@/entities/employee';
import Alert from '@mui/material/Alert';
import Loading from '@/shared/ui/Loading';
import { useTranslation } from 'react-i18next';
import { EmployeeList, EmployeeListProvider } from '@/features/employees';

export function EmployeesListPage() {
  const { t } = useTranslation('employees');
  const navigate = useNavigate();
  const { employees, isLoading, isError, refetch } = useEmployees();

  const handleCreateClick = React.useCallback(() => {
    navigate('/employees/create');
  }, [navigate]);

  if (isError) {
    return (
      <PageContainer
        breadcrumbs={[{ title: t('pages.list.title') }]}
        fixedHeight={true}
      >
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              {t('pages.list.retry')}
            </Button>
          }
        >
          {t('pages.list.loadError')}
        </Alert>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer
        fixedHeight={true}
        breadcrumbs={[{ title: t('pages.list.title') }]}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Loading />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      fixedHeight={true}
      breadcrumbs={[{ title: t('pages.list.title') }]}
      actions={
        <Button
          variant="contained"
          onClick={handleCreateClick}
          startIcon={<AddIcon />}
          size="small"
        >
          {t('pages.list.new')}
        </Button>
      }
    >
      <Box
        sx={{
          flex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <EmployeeListProvider employees={employees} isLoading={isLoading}>
          <EmployeeList />
        </EmployeeListProvider>
      </Box>
    </PageContainer>
  );
}
