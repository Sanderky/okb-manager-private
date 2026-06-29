import { Button, Alert } from '@mui/material';
import { Add } from '@mui/icons-material';
import PageContainer from '@/shared/ui/PageContainer';
import { useTranslation } from 'react-i18next';
import {
  CalendarProvider,
  useCalendarContext,
  EventsCalendar,
} from '@/features/calendar';

const CalendarPageContent = () => {
  const { state, actions } = useCalendarContext();
  const { t } = useTranslation(['calendar', 'common']);

  if (state.status.error) {
    return (
      <PageContainer
        breadcrumbs={[{ title: t('calendar:pageTitle') }]}
        fixedHeight={true}
      >
        <Alert severity="error">{t('common:errors.load')}</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      fixedHeight={true}
      breadcrumbs={[{ title: t('calendar:pageTitle') }]}
      actions={[
        <Button
          key="add"
          variant="contained"
          startIcon={<Add />}
          disabled={state.status.loading}
          size="small"
          onClick={() => actions.handleOnAddEventButtonClick()}
        >
          {t('calendar:actions.addEvent')}
        </Button>,
      ]}
    >
      <EventsCalendar />
    </PageContainer>
  );
};

export const CalendarPage = () => {
  return (
    <CalendarProvider>
      <CalendarPageContent />
    </CalendarProvider>
  );
};
