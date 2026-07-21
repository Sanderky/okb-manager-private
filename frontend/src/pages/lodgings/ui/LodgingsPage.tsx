import { Box, Button, Typography } from '@mui/material';
import { Hotel } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/shared/ui/PageContainer';
import Loading from '@/shared/ui/Loading';
import {
  LodgingsActions,
  LodgingsBottomToolbar,
  LodgingsTimeline,
  ManageLodgingDialog,
  LodgingsCards,
  LodgingsProvider,
  useLodgingsContext,
} from '@/features/lodgings';

export const LodgingsPage = () => {
  return (
    <LodgingsProvider>
      <LodgingsView />
    </LodgingsProvider>
  );
};

const LodgingsView = () => {
  const { t } = useTranslation(['lodgings']);
  const { isLoading, lodgings, viewMode, openAdd } = useLodgingsContext();

  if (isLoading) {
    return (
      <PageContainer
        fixedHeight
        breadcrumbs={[{ title: t('lodgings:pageTitle') }]}
      >
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Loading />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      fixedHeight
      breadcrumbs={[{ title: t('lodgings:pageTitle') }]}
      actions={<LodgingsActions />}
      renderBottomToolbar={<LodgingsBottomToolbar />}
    >
      <Box sx={{ height: '100%', overflowY: 'auto' }}>
        {lodgings.length === 0 ? (
          <Box textAlign="center" py={5}>
            <Hotel sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {t('lodgings:emptyState.title')}
            </Typography>
            <Button sx={{ mt: 2 }} onClick={openAdd}>
              {t('lodgings:emptyState.addFirst')}
            </Button>
          </Box>
        ) : viewMode === 'timeline' ? (
          <LodgingsTimeline />
        ) : (
          <LodgingsCards />
        )}

        <ManageLodgingDialog />
      </Box>
    </PageContainer>
  );
};
