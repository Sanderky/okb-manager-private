import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router';
import PageContainer from '@/shared/ui/PageContainer';
import { EmployeeApi } from '@/entities/employee';
import { useQuery } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import 'dayjs/locale/pl';
import Loading from '@/shared/ui/Loading';
import { EmployeeList } from '@/features/employees';

export function EmployeesListPage() {
  const navigate = useNavigate();
  const {
    data: employees = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: () => EmployeeApi.getEmployeeList(),
  });

  const handleCreateClick = React.useCallback(() => {
    navigate('/employees/create');
  }, [navigate]);

  if (error) {
    return (
      <PageContainer
        breadcrumbs={[{ title: 'Lista pracowników' }]}
        fixedHeight={true}
      >
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Ponów próbę
            </Button>
          }
        >
          Nie udało się załadować listy pracowników.
        </Alert>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer
        fixedHeight={true}
        breadcrumbs={[{ title: 'Lista pracowników' }]}
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
      // renderBottomToolbar={<TablePagination table={table} />}
      fixedHeight={true}
      breadcrumbs={[{ title: 'Lista pracowników' }]}
      actions={
        <Button
          variant="contained"
          onClick={handleCreateClick}
          startIcon={<AddIcon />}
          size="small"
        >
          Nowy
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
        <EmployeeList employees={employees} isLoading={isLoading} />
      </Box>
    </PageContainer>
  );
}
