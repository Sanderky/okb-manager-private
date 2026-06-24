import { Button, Alert } from '@mui/material';
import { Add, ListAlt as ListAltIcon } from '@mui/icons-material';
import PageContainer from '@/shared/ui/PageContainer';
import {
  useVacationsContext,
  VacationsCalendar,
  VacationsProvider,
} from '@/features/vacations';

const VacationsPageContent = () => {
  const { state, actions } = useVacationsContext();

  if (state.status.error) {
    return (
      <PageContainer
        breadcrumbs={[{ title: 'Kalendarz urlopów' }]}
        fixedHeight={true}
      >
        <Alert severity="error">Wystąpił błąd podczas ładowania danych.</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      fixedHeight={true}
      breadcrumbs={[{ title: 'Kalendarz urlopów' }]}
      actions={[
        <Button
          key="add"
          size="small"
          variant="contained"
          startIcon={<Add />}
          disabled={state.status.loading || state.employees.length === 0}
          onClick={actions.handleOnAddEventButtonClick}
        >
          Dodaj urlop
        </Button>,
        <Button
          key="report"
          size="small"
          variant="contained"
          startIcon={<ListAltIcon />}
          disabled={state.status.loading || state.employees.length === 0}
          onClick={() => actions.setters.setIsVacationReportOpen(true)}
        >
          Wykaz urlopów
        </Button>,
      ]}
    >
      <VacationsCalendar />
    </PageContainer>
  );
};

export const VacationsPage = () => {
  return (
    <VacationsProvider>
      <VacationsPageContent />
    </VacationsProvider>
  );
};
