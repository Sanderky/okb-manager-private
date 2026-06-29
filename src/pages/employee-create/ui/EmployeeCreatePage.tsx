import PageContainer from '@/shared/ui/PageContainer';
import { Box } from '@mui/material';
import Loading from '@/shared/ui/Loading';
import { useTranslation } from 'react-i18next';
import {
  AddEmployee,
  AddEmployeeProvider,
  useAddEmployeeContext,
} from '@/features/employees';

export function EmployeeCreatePage() {
  return (
    <AddEmployeeProvider>
      <PageContent />
    </AddEmployeeProvider>
  );
}

const PageContent = () => {
  const { t } = useTranslation('employees');
  const { actionLoading } = useAddEmployeeContext();

  if (actionLoading) {
    return <Loading message={t('pages.create.loading')} />;
  }

  return (
    <PageContainer
      title={t('pages.create.title')}
      breadcrumbs={[
        { title: t('pages.breadcrumbs.employees'), path: '/employees' },
        { title: t('pages.breadcrumbs.new') },
      ]}
    >
      <Box sx={{ px: { xs: 0.5, sm: 2 }, py: 2 }}>
        <Box
          sx={(theme) => ({
            width: '100%',
            maxWidth: { sm: '100%', md: '1790px' },
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          })}
          className="rounded-lg p-3 md:p-4"
        >
          <AddEmployee />
        </Box>
      </Box>
    </PageContainer>
  );
};
