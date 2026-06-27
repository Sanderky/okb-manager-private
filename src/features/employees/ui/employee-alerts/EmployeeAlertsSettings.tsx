import {
  Typography,
  Stack,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAlertsSettings } from '../../model/services/useAlertsSettings';

interface EmployeeAlertsSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeAlertsSettingsBase = ({
  isOpen,
  onClose,
}: EmployeeAlertsSettingsProps) => {
  const { t } = useTranslation(['employees', 'common']);

  const {
    formData,
    formErrors,
    hasChanges,
    isLoading,
    isError,
    handleInputChange,
    handleSave,
    handleClose,
    isSaving,
  } = useAlertsSettings(isOpen, onClose);

  return (
    <Box>
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('alertsSettings.loadError')}
        </Alert>
      ) : (
        <>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {t('alertsSettings.contractTitle')}
          </Typography>
          <Stack direction={'column'} spacing={3}>
            <TextField
              label={t('alertsSettings.warningDays')}
              type="number"
              error={Boolean(formErrors.contractWarning)}
              helperText={formErrors.contractWarning}
              size="small"
              value={formData.contractWarning}
              onChange={(e) =>
                handleInputChange('contractWarning', e.target.value)
              }
              slotProps={{
                htmlInput: {
                  min: 0,
                },
              }}
            />
            <TextField
              label={t('alertsSettings.criticalDays')}
              size="small"
              type="number"
              error={Boolean(formErrors.contractCritical)}
              helperText={formErrors.contractCritical}
              value={formData.contractCritical}
              onChange={(e) =>
                handleInputChange('contractCritical', e.target.value)
              }
              slotProps={{
                htmlInput: {
                  min: 0,
                },
              }}
            />
          </Stack>

          <Typography variant="subtitle2" sx={{ my: 2 }}>
            {t('alertsSettings.a1Title')}
          </Typography>
          <Stack direction={'column'} spacing={3} sx={{ mb: 3 }}>
            <TextField
              label={t('alertsSettings.warningDays')}
              type="number"
              size="small"
              helperText={formErrors.a1Warning}
              error={Boolean(formErrors.a1Warning)}
              value={formData.a1Warning}
              onChange={(e) => handleInputChange('a1Warning', e.target.value)}
              slotProps={{
                htmlInput: {
                  min: 0,
                },
              }}
            />
            <TextField
              label={t('alertsSettings.criticalDays')}
              type="number"
              error={Boolean(formErrors.a1Critical)}
              size="small"
              helperText={formErrors.a1Critical}
              value={formData.a1Critical}
              onChange={(e) => handleInputChange('a1Critical', e.target.value)}
              slotProps={{
                htmlInput: {
                  min: 0,
                },
              }}
            />
          </Stack>
          <Stack direction="row" spacing={1} justifyContent={'flex-start'}>
            <Button
              onClick={handleClose}
              variant="outlined"
              size="small"
              loading={isSaving}
              color="inherit"
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={!hasChanges}
              size="small"
              loading={isSaving}
            >
              {t('common:buttons.save')}
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
};
