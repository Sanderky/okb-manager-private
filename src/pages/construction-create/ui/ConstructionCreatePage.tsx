import PageContainer from '@/shared/ui/PageContainer';
import { Box } from '@mui/material';
import Loading from '@/shared/ui/Loading';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['constructions', 'common']);
  const { actionLoading } = useAddConstructionContext();

  if (actionLoading) {
    return <Loading message={t('create.loading')} />;
  }

  return (
    <AddConstructionProvider>
      <PageContainer
        title={t('create.title')}
        breadcrumbs={[
          { title: t('title', 'Budowy'), path: '/constructions' },
          { title: t('create.breadcrumb', 'Nowa') },
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
