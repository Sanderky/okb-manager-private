import { Button, Alert } from '@mui/material';
import { Add } from '@mui/icons-material';
import PageContainer from '@/shared/ui/PageContainer';
import {
  CalendarProvider,
  useCalendarContext,
  EventsCalendar,
} from '@/features/calendar';

const CalendarPageContent = () => {
  const { state, actions } = useCalendarContext();

  if (state.status.error) {
    return (
      <PageContainer breadcrumbs={[{ title: 'Kalendarz' }]} fixedHeight={true}>
        <Alert severity="error">Wystąpił błąd podczas ładowania danych.</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      fixedHeight={true}
      breadcrumbs={[{ title: 'Kalendarz' }]}
      actions={[
        <Button
          key="add"
          variant="contained"
          startIcon={<Add />}
          disabled={state.status.loading}
          size="small"
          onClick={() => actions.handleOnAddEventButtonClick()}
        >
          Dodaj wydarzenie
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
