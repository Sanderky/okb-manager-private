import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageContainer from '@/shared/ui/PageContainer';
import 'dayjs/locale/pl';
import { Alert } from '@mui/material';
import { Engineering } from '@mui/icons-material';
import Loading from '@/shared/ui/Loading';
import { ContractorsDialog } from '@/features/contractors';
import { useConstructions } from '@/entities/construction';
import {
  ConstructionsList,
  ConstructionsListProvider,
} from '@/features/constructions';

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

  const { constructions, isLoading, isError, refetch } = useConstructions();

  const handleCreateClick = React.useCallback(
    () => navigate('/constructions/create'),
    [navigate]
  );

  if (isError) {
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
          open={contractorsModalOpen}
          onClose={handleCloseContractors}
        />

        <ConstructionsListProvider
          constructions={constructions}
          isLoading={isLoading}
        >
          <ConstructionsList />
        </ConstructionsListProvider>
      </Box>
    </PageContainer>
  );
}
