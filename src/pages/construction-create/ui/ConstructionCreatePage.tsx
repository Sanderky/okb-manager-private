import PageContainer from '@/shared/ui/PageContainer';
import { Box } from '@mui/material';
import Loading from '@/shared/ui/Loading';
import {
  AddConstruction,
  AddConstructionProvider,
  useAddConstructionContext,
} from '@/features/constructions';

export function ConstructionCreatePage() {
  return (
    <AddConstructionProvider>
      <PageContent />
    </AddConstructionProvider>
  );
}

const PageContent = () => {
  const { actionLoading } = useAddConstructionContext();

  if (actionLoading) {
    return <Loading message="Trwa tworzenie nowej budowy..." />;
  }

  return (
    <AddConstructionProvider>
      <PageContainer
        title={'Dodaj nową budowę'}
        breadcrumbs={[
          { title: 'Budowy', path: '/constructions' },
          { title: 'Nowa' },
        ]}
      >
        <Box
          sx={{
            px: { xs: 0.5, sm: 2 },
            py: 2,
          }}
        >
          <Box
            sx={(theme) => ({
              width: '100%',
              maxWidth: { sm: '100%', md: '1790px' },
              // boxShadow: 1,
              background: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            })}
            className="rounded-lg p-3 md:p-4"
          >
            <AddConstruction />
          </Box>
        </Box>
      </PageContainer>
    </AddConstructionProvider>
  );
};
