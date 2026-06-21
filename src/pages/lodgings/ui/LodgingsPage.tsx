import { Box, Button, Typography } from '@mui/material';
import { Hotel } from '@mui/icons-material';
import 'dayjs/locale/pl';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { plPL } from '@mui/x-date-pickers/locales';
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
  const { isLoading, lodgings, viewMode, openAdd } = useLodgingsContext();

  if (isLoading) {
    return (
      <PageContainer fixedHeight breadcrumbs={[{ title: 'Noclegi' }]}>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Loading />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      fixedHeight
      breadcrumbs={[{ title: 'Noclegi' }]}
      actions={<LodgingsActions />}
      renderBottomToolbar={<LodgingsBottomToolbar />}
    >
      <LocalizationProvider
        localeText={
          plPL.components.MuiLocalizationProvider.defaultProps.localeText
        }
        dateAdapter={AdapterDayjs}
        adapterLocale="pl"
      >
        <Box sx={{ height: '100%', overflowY: 'auto' }}>
          {lodgings.length === 0 ? (
            <Box textAlign="center" py={5}>
              <Hotel sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Brak zaplanowanych noclegów
              </Typography>
              <Button sx={{ mt: 2 }} onClick={openAdd}>
                Dodaj pierwszy nocleg
              </Button>
            </Box>
          ) : viewMode === 'timeline' ? (
            <LodgingsTimeline />
          ) : (
            <LodgingsCards />
          )}

          <ManageLodgingDialog />
        </Box>
      </LocalizationProvider>
    </PageContainer>
  );
};
