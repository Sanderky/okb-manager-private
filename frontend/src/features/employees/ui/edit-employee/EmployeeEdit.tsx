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
import { useTranslation } from 'react-i18next';
import { useEmployeeEditContext } from '../../model/providers/useEmployeeEditContext';
import { EmployeeForm } from '../EmployeeForm';

export const EmployeeEdit = () => {
  const { t } = useTranslation(['employees', 'common']);
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
                  {t('edit.archive.title')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('edit.archive.description')}
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
                {t('edit.archive.button')}
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
                  {t('edit.activate.title')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('edit.activate.description')}
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
                {t('edit.activate.button')}
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
                {t('edit.delete.title')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('edit.delete.description')}
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
              {t('edit.delete.button')}
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
            <span>{t('edit.dialog.title')}</span>
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
              {t('common:buttons.cancel')}
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
              {t('common:buttons.delete')}
            </Button>
          </Stack>
        }
        loading={isDeleting}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body1" className="text-gray-600">
            {t('edit.dialog.confirm')} <strong>{employee.name}</strong>?
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            {t('edit.dialog.info')}
          </Typography>
          <Alert severity="error">
            <AlertTitle>{t('edit.dialog.warningTitle')}</AlertTitle>
            {t('edit.dialog.warningText')}
          </Alert>
          <Stack sx={{ mt: 2 }} direction="column" spacing={0.5}>
            <Typography variant="subtitle2">
              {t('edit.dialog.prompt')}
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