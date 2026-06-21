import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { AlertTitle, Stack, TextField, Typography } from '@mui/material';
import { alpha, Grid } from '@mui/system';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import BaseDialog from '@/shared/ui/BaseDialog';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import {
  ConstructionForm,
  FinishConstruction,
  ResumeConstruction,
  useConstructionEditContext,
} from '@/features/constructions';
import { useRef, useState } from 'react';

export const ConstructionEdit = () => {
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);

  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const formRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const {
    handleSubmit: onSubmit,
    handleDeleteConstruction: onDelete,
    handleFieldChange,
    isFormLoading,
    actionLoading,
    formState,
    construction,
    isUpdateError,
    isDeleting,
    isLoading,
  } = useConstructionEditContext();

  const registerFieldRef = (name: string, el: HTMLInputElement | null) => {
    formRefs.current[name] = el;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit((validationErrors) => {
      const firstErrorKey = Object.keys(validationErrors)[0];
      const firstErrorInput = formRefs.current[firstErrorKey];
      if (firstErrorInput) {
        firstErrorInput.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    });
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConstruction = async () => {
    await onDelete(
      () => {
        setDeleteDialogOpen(false);
      },
      () => {
        setDeleteDialogOpen(false);
      }
    );
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  return (
    construction && (
      <>
        <Grid container columns={12} spacing={{ xs: 3, lg: 2 }}>
          <Grid size={{ xs: 12, lg: 8, xl: 9 }}>
            <Box
              sx={(theme) => ({
                width: '100%',
                maxWidth: { sm: '100%', md: '1790px' },
                // boxShadow: 1,
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              })}
              className="rounded-lg p-3 md:p-4"
            >
              <ConstructionForm
                formState={formState}
                onFieldChange={handleFieldChange}
                onSubmit={handleSubmit}
                isSubmitting={actionLoading}
                submitError={
                  isUpdateError
                    ? 'Wystąpił błąd podczas aktualizacji budowy.'
                    : null
                }
                isEditForm={true}
                registerFieldRef={registerFieldRef}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, lg: 4, xl: 3 }}>
            {construction.status ? (
              <Stack
                direction={{ xs: 'column' }}
                justifyContent={{ xs: 'flex-start' }}
                alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                spacing={{ xs: 1, xl: 2 }}
                className="mb-4 rounded-lg p-3"
                maxWidth={'400px'}
                sx={(theme) => ({
                  border: `1px solid ${theme.palette.warning.main}`,
                  background: alpha(theme.palette.warning.main, 0.1),
                })}
              >
                <div>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Zakończ budowę
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Status budowy zmienia się na "Zakończona".
                  </Typography>
                </div>
                <Button
                  variant="contained"
                  color={'warning'}
                  sx={{ minWidth: 120 }}
                  onClick={() => setEndDialogOpen(true)}
                  loading={isFormLoading}
                  startIcon={<ArchiveIcon />}
                >
                  Zakończ
                </Button>
              </Stack>
            ) : (
              <Stack
                direction={{ xs: 'column' }}
                justifyContent={{ xs: 'flex-start' }}
                alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                spacing={{ xs: 1, xl: 2 }}
                className="mb-4 rounded-lg p-3"
                maxWidth={'400px'}
                sx={(theme) => ({
                  border: `1px solid ${theme.palette.success.main}`,
                  background: alpha(theme.palette.success.main, 0.1),
                })}
              >
                <div>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Aktywuj budowę
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Status budowy zmienia się na "W trakcie".
                  </Typography>
                </div>
                <Button
                  variant="contained"
                  color={'success'}
                  sx={{ minWidth: 120 }}
                  onClick={() => setResumeDialogOpen(true)}
                  loading={isFormLoading}
                  startIcon={<UnarchiveIcon />}
                >
                  Aktywuj
                </Button>
              </Stack>
            )}
            <Stack
              direction={{ xs: 'column' }}
              justifyContent={{ xs: 'flex-start' }}
              alignItems={{ xs: 'stretch', sm: 'flex-start' }}
              spacing={{ xs: 1, xl: 2 }}
              className="rounded-lg border p-3"
              maxWidth={'400px'}
              sx={(theme) => ({
                border: `1px solid ${theme.palette.error.main}`,
                background: alpha(theme.palette.error.main, 0.1),
              })}
            >
              <div>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Usuń budowę
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Trwale usuwa budowę z bazy danych. Tej operacji nie można
                  cofnąć.
                </Typography>
              </div>
              <Button
                variant="contained"
                color="error"
                sx={{ minWidth: 120 }}
                onClick={handleDeleteClick}
                loading={isDeleting || isLoading || actionLoading}
                startIcon={<HighlightOffIcon />}
              >
                Usuń
              </Button>
            </Stack>
          </Grid>
        </Grid>

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

        <BaseDialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <WarningAmberIcon className="text-red-600" />
              <span>Usuwanie budowy</span>
            </Stack>
          }
          actions={
            <Stack direction="row" spacing={1}>
              <Button
                onClick={handleDeleteCancel}
                variant="outlined"
                loading={isDeleting}
                color="inherit"
              >
                Anuluj
              </Button>
              <Button
                onClick={handleDeleteConstruction}
                variant="contained"
                loading={isDeleting}
                color="error"
                disabled={
                  deleteConfirmation.toLocaleLowerCase() !==
                  construction.name.trim().toLocaleLowerCase()
                }
              >
                Usuń
              </Button>
            </Stack>
          }
          loading={isDeleting}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body1" className="text-gray-600">
              Czy na pewno chcesz usunąć <strong>{construction.name}</strong>?
            </Typography>
            <Typography variant="body1" className="text-gray-600">
              Budowa zostanie usunięta z bazy danych łącznie ze wszytkimi
              plikami oraz powiązanymi informacjami.
            </Typography>
            <Alert severity="error">
              <AlertTitle>Uwaga!</AlertTitle>
              Tej operacji nie można cofnąć. Zamiast tego, proszę rozważyć
              zakończenie budowy.
            </Alert>
            <Stack sx={{ mt: 2 }} direction={'column'} spacing={0.5}>
              <Typography variant="subtitle2">
                Aby usunąć budowę, wprowadź poniżej jej pełną nazwę:
              </Typography>
              <TextField
                value={deleteConfirmation}
                size="small"
                onChange={(e) => setDeleteConfirmation(e.target.value)}
              />
            </Stack>
          </Box>
        </BaseDialog>
      </>
    )
  );
};
