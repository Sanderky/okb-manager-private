import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Box, Chip, Alert, Button } from '@mui/material';
import PageContainer from '@/shared/ui/PageContainer';
import Loading from '@/shared/ui/Loading';
import { FileBrowser } from '@/features/file-browser';
import { FOLDER_NAMES } from '@/shared/config/storage';
import {
  ConstructionShow,
  ConstructionShowProvider,
  ConstructionShowTopToolbar,
  FinishConstruction,
  ResumeConstruction,
  useConstructionShowContext,
} from '@/features/constructions';

export function ConstructionShowPage() {
  const { constructionId } = useParams<{ constructionId: string }>();

  if (!constructionId) return null;

  return (
    <ConstructionShowProvider constructionId={constructionId}>
      <ConstructionShowContent />
    </ConstructionShowProvider>
  );
}

export const ConstructionShowContent = () => {
  const [tab, setTab] = useState(0);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);

  const {
    construction,
    loading,
    error,
    notFound,
    isInProgress,
    handleNavigateBack,
    handleNavigateToConstructionEdit,
  } = useConstructionShowContext();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };
  if (loading) return <Loading message="Ładowanie danych budowy..." />;
  if (error)
    return (
      <Alert severity="error">
        Wystąpił błąd podczas ładowania danych budowy.
      </Alert>
    );
  if (notFound)
    return (
      <Box sx={{ width: '100%' }}>
        <Alert severity="info">
          Nie znaleziono budowy. Mogła zostać usunięta lub nie istnieje.
        </Alert>
        <Button variant="contained" onClick={handleNavigateBack} sx={{ mt: 2 }}>
          Wróć
        </Button>
      </Box>
    );

  const pageTitle = construction?.name || '...';

  return (
    <PageContainer
      fixedHeight={loading || tab === 1}
      title={`Budowa ${pageTitle}`}
      breadcrumbs={[
        { title: 'Budowy', path: '/constructions' },
        { title: pageTitle },
      ]}
      actions={
        <Chip
          label={isInProgress ? 'W trakcie' : 'Zakończona'}
          sx={(theme) => ({
            borderRadius: 1,
            p: 0.5,
            ml: 2,
            textTransform: 'uppercase',
            fontWeight: 600,
            color: isInProgress
              ? theme.palette.status.construction.active.text
              : theme.palette.status.construction.inactive.text,
            background: isInProgress
              ? theme.palette.status.construction.active.background
              : theme.palette.status.construction.inactive.background,
          })}
        />
      }
      renderTopToolbar={
        <ConstructionShowTopToolbar
          isInProgress={isInProgress}
          tab={tab}
          handleTabChange={handleTabChange}
          handleNavigateToConstructionEdit={handleNavigateToConstructionEdit}
          handleOpenFinishConstructionDialogOpen={() => setEndDialogOpen(true)}
          handleOpenResumeConstructionDialogOpen={() =>
            setResumeDialogOpen(true)
          }
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
        }}
      >
        {tab === 0 ? (
          <ConstructionShow />
        ) : (
          <FileBrowser
            baseDirectory={`${FOLDER_NAMES['employees']}/${construction?.id}`}
          />
        )}
      </Box>

      {construction && (
        <>
          <FinishConstruction
            open={endDialogOpen}
            onClose={() => setEndDialogOpen(false)}
            construction={construction}
          />
          <ResumeConstruction
            open={resumeDialogOpen}
            onClose={() => setResumeDialogOpen(false)}
            construction={construction}
          />
        </>
      )}
    </PageContainer>
  );
};
