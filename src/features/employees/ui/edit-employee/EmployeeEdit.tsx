import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Stack,
  Typography,
  TextField,
  Alert,
  AlertTitle,
} from '@mui/material';
import { alpha, Grid } from '@mui/system';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import BaseDialog from '@/shared/ui/BaseDialog';
import { useEmployeeEditContext } from '../../model/providers/useEmployeeEditContext';
import { EmployeeForm } from '../EmployeeForm';

export const EmployeeEdit = () => {
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const formRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const {
    employee,
    formState,
    handleFieldChange,
    handleSubmit: onSubmit,
    handleDeleteEmployee: onDelete,
    handleEmployeeStatus,
    isFormLoading,
    actionLoading,
    isDeleting,
    handleCancel,
  } = useEmployeeEditContext();

  const registerFieldRef = (name: string, el: HTMLInputElement | null) => {
    formRefs.current[name] = el;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit((validationErrors) => {
      const firstErrorKey = Object.keys(validationErrors)[0];
      const firstErrorInput = formRefs.current[firstErrorKey];
      if (firstErrorInput)
        firstErrorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const handleDeleteClick = () => {
    setDeleteConfirmation('');
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteConfirmation('');
  };

  const handleDeleteEmployee = async () => {
    await onDelete(
      () => setDeleteDialogOpen(false),
      () => setDeleteDialogOpen(false)
    );
  };

  if (!employee) return null;

  return (
    <>
      <Grid container columns={12} spacing={{ xs: 3, lg: 2 }}>
        <Grid size={{ xs: 12, lg: 8, xl: 9 }}>
          <Box
            sx={(theme) => ({
              width: '100%',
              maxWidth: { sm: '100%', md: '1790px' },
              position: 'relative',
              background: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            })}
            className="rounded-lg p-3 md:p-4"
          >
            <EmployeeForm
              formState={formState}
              onFieldChange={handleFieldChange}
              onSubmit={handleSubmit}
              isSubmitting={actionLoading}
              isEditForm={true}
              registerFieldRef={registerFieldRef}
              onCancel={handleCancel}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, lg: 4, xl: 3 }}>
          {employee.status ? (
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
                  Archiwizuj pracownika
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Status pracownika zmienia się na "Nieaktywny".
                </Typography>
              </div>
              <Button
                variant="contained"
                color="warning"
                sx={{ minWidth: 120 }}
                onClick={() => handleEmployeeStatus(false)}
                loading={isFormLoading}
                startIcon={<ArchiveIcon />}
              >
                Archiwizuj
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
                  Aktywuj pracownika
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Status pracownika zmienia się na "Aktywny".
                </Typography>
              </div>
              <Button
                variant="contained"
                color="success"
                sx={{ minWidth: 120 }}
                onClick={() => handleEmployeeStatus(true)}
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
            className="rounded-lg p-3"
            maxWidth={'400px'}
            sx={(theme) => ({
              border: `1px solid ${theme.palette.error.main}`,
              background: alpha(theme.palette.error.main, 0.1),
            })}
          >
            <div>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Usuń pracownika
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Trwale usuwa pracownika z bazy danych. Tej operacji nie można
                cofnąć.
              </Typography>
            </div>
            <Button
              variant="contained"
              color="error"
              sx={{ minWidth: 120 }}
              onClick={handleDeleteClick}
              loading={isFormLoading || isDeleting}
              startIcon={<HighlightOffIcon />}
            >
              Usuń
            </Button>
          </Stack>
        </Grid>
      </Grid>

      <BaseDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        title={
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningAmberIcon className="text-red-600" />
            <span>Usuwanie pracownika</span>
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
              onClick={handleDeleteEmployee}
              variant="contained"
              loading={isDeleting}
              color="error"
              disabled={
                deleteConfirmation.toLocaleLowerCase() !==
                employee.name.trim().toLocaleLowerCase()
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
            Czy na pewno chcesz usunąć <strong>{employee.name}</strong>?
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            Pracownik zostanie usunięty z bazy danych łącznie ze wszytkimi jego
            plikami oraz powiązanymi informacjami.
          </Typography>
          <Alert severity="error">
            <AlertTitle>Uwaga!</AlertTitle>Tej operacji nie można cofnąć.
            Zamiast tego, proszę rozważyć archiwizację pracownika.
          </Alert>
          <Stack sx={{ mt: 2 }} direction="column" spacing={0.5}>
            <Typography variant="subtitle2">
              Aby usunąć pracownika, wprowadź poniżej jego pełną nazwę:
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
  );
};
