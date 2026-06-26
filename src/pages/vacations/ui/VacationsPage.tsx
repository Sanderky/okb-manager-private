import { Button, Alert } from '@mui/material';
import { Add, ListAlt as ListAltIcon } from '@mui/icons-material';
import PageContainer from '@/shared/ui/PageContainer';
import { useTranslation } from 'react-i18next';
import {
  useVacationsContext,
  VacationsCalendar,
  VacationsProvider,
} from '@/features/vacations';

const VacationsPageContent = () => {
  const { state, actions } = useVacationsContext();
  const { t } = useTranslation(['vacations', 'common']);

  if (state.status.error) {
    return (
      <PageContainer
        breadcrumbs={[{ title: t('vacations:pageTitle') }]}
        fixedHeight={true}
      >
        <Alert severity="error">{t('common:errors.load')}</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      fixedHeight={true}
      breadcrumbs={[{ title: t('vacations:pageTitle') }]}
      actions={[
        <Button
          key="add"
          size="small"
          variant="contained"
          startIcon={<Add />}
          disabled={state.status.loading || state.employees.length === 0}
          onClick={actions.handleOnAddEventButtonClick}
        >
          {t('vacations:actions.addVacation')}
        </Button>,
        <Button
          key="report"
          size="small"
          variant="contained"
          startIcon={<ListAltIcon />}
          disabled={state.status.loading || state.employees.length === 0}
          onClick={() => actions.setters.setIsVacationReportOpen(true)}
        >
          {t('vacations:actions.vacationReport')}
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
