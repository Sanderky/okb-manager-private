import { useParams } from 'react-router-dom';
import { Box, Chip, Alert, Button, Stack } from '@mui/material';
import PageContainer from '@/shared/ui/PageContainer';
import Loading from '@/shared/ui/Loading';
import { FileBrowser } from '@/features/file-browser';
import { FOLDER_NAMES } from '@/shared/config/storage';
import { FilePreview } from '@/shared/ui/FilePreviewDialog';
import { useTranslation } from 'react-i18next';
import {
  EmployeeShow,
  EmployeeShowProvider,
  EmployeeShowTopToolbar,
  useEmployeeShowContext,
} from '@/features/employees';

export function EmployeeShowPage() {
  const { employeeId } = useParams<{ employeeId: string }>();

  if (!employeeId) return null;

  return (
    <EmployeeShowProvider employeeId={employeeId}>
      <EmployeeShowContent />
    </EmployeeShowProvider>
  );
}

const EmployeeShowContent = () => {
  const { t } = useTranslation(['employees', 'common']);

  const {
    employee,
    loading,
    error,
    notFound,
    tab,
    previewFile,
    isPreviewOpen,
    handleTabChange,
    handleEmployeeEdit,
    handleBack,
    handleClosePreview,
  } = useEmployeeShowContext();

  if (loading) return <Loading message={t('pages.show.loading')} />;
  if (error)
    return (
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <Alert severity="error">{t('pages.show.loadError')}</Alert>
      </Box>
    );
  if (notFound)
    return (
      <Box sx={{ width: '100%' }}>
        <Alert severity="info">{t('pages.show.notFound')}</Alert>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button color="inherit" variant="contained" onClick={handleBack}>
            {t('common:buttons.back')}
          </Button>
        </Stack>
      </Box>
    );

  const pageTitle = employee?.name || t('pages.show.fallbackName');

  return (
    <PageContainer
      fixedHeight={loading || tab === 1}
      title={t('pages.show.title', { name: pageTitle })}
      breadcrumbs={[
        { title: t('pages.breadcrumbs.employees'), path: '/employees' },
        { title: pageTitle },
      ]}
      actions={
        <Stack direction="row" alignItems="center">
          {employee && (
            <Chip
              label={
                employee.status
                  ? t('list.status.active')
                  : t('list.status.inactive')
              }
              variant="filled"
              sx={(theme) => ({
                borderRadius: 1,
                p: 0.5,
                ml: 2,
                textTransform: 'uppercase',
                fontWeight: 600,
                color: employee.status
                  ? theme.palette.status.employee.active.text
                  : theme.palette.status.employee.inactive.text,
                background: employee.status
                  ? theme.palette.status.employee.active.background
                  : theme.palette.status.employee.inactive.background,
              })}
            />
          )}
        </Stack>
      }
      renderTopToolbar={
        <EmployeeShowTopToolbar
          tab={tab}
          handleTabChange={handleTabChange}
          handleEmployeeEdit={handleEmployeeEdit}
        />
      }
    >
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          width: '100%',
          py: tab === 0 ? 2 : 0,
          px: tab === 0 ? { xs: 0.5, sm: 2 } : 0,
          height: tab === 0 ? 'auto' : '100%',
        }}
      >
        {tab === 0 ? (
          <EmployeeShow />
        ) : (
          <FileBrowser
            baseDirectory={`${FOLDER_NAMES['employees']}/${employee?.id}`}
          />
        )}
      </Box>

      <FilePreview
        open={isPreviewOpen}
        onClose={handleClosePreview}
        file={previewFile}
      />
    </PageContainer>
  );
};
