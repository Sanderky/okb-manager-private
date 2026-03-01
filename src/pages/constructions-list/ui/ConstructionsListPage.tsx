import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useSearchParams } from 'react-router';
import PageContainer from '@/shared/ui/PageContainer';
import { useQuery } from '@tanstack/react-query';
import 'dayjs/locale/pl';
import { Alert } from '@mui/material';
import { Engineering } from '@mui/icons-material';
import Loading from '@/shared/ui/Loading';
import { ContractorsDialog } from '@/features/contractors';
import { ConstructionApi } from '@/entities/construction';
import { ConstructionsList } from '@/features/constructions';

export function ConstructionsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const contractorsModalOpen =
    searchParams.get('view') === 'contractors' ||
    !!searchParams.get('contractorId');

  const handleOpenContractors = () => {
    setSearchParams((prev) => {
      prev.set('view', 'contractors');
      return prev;
    });
  };

  const handleCloseContractors = () => {
    setSearchParams((prev) => {
      prev.delete('view');
      prev.delete('contractorId');
      return prev;
    });
  };

  const {
    data: constructions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['constructions'],
    queryFn: () => ConstructionApi.getConstructionList(),
  });

  const handleCreateClick = React.useCallback(() => {
    navigate('/constructions/create');
  }, [navigate]);

  if (error) {
    return (
      <PageContainer
        breadcrumbs={[{ title: 'Lista budów' }]}
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
          Wystąpił błąd podczas ładowania listy budów.
        </Alert>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer
        fixedHeight={true}
        breadcrumbs={[{ title: 'Lista budów' }]}
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
      breadcrumbs={[{ title: 'Lista budów' }]}
      actions={[
        <Button
          key="contractors"
          variant="contained"
          onClick={handleOpenContractors}
          startIcon={<Engineering />}
          size="small"
        >
          Wykonawcy
        </Button>,
        <Button
          key="new"
          variant="contained"
          onClick={handleCreateClick}
          startIcon={<AddIcon />}
          size="small"
        >
          Nowa
        </Button>,
      ]}
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
        <ContractorsDialog
          constructions={constructions}
          open={contractorsModalOpen}
          onClose={handleCloseContractors}
        />
        <ConstructionsList
          isLoading={isLoading}
          constructions={constructions}
        />
      </Box>
    </PageContainer>
  );
}
