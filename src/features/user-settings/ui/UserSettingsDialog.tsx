import React from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  useTheme,
} from '@mui/material';
import { OutgoingMail } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import BaseDialog from '@/shared/ui/BaseDialog';
import { useUserSettings } from '../model/services/useUserSettings';

interface UserSettingsBaseProps {
  open: boolean;
  showEmailConfirmationButton?: boolean;
}

export const UserSettingsBase = ({
  open,
  showEmailConfirmationButton = false,
}: UserSettingsBaseProps) => {
  const theme = useTheme();
  const { t } = useTranslation(['auth', 'common']);

  const {
    user,
    displayName,
    setDisplayName,
    email,
    setEmail,
    emailEditMode,
    setEmailEditMode,
    usernameEditMode,
    setUsernameEditMode,
    verificationEmailInfo,
    setVerificationEmailInfo,
    fieldsErrors,
    isUsernameLoading,
    isEmailLoading,
    handleCancelUsername,
    handleCancelEmail,
    handleSaveUsername,
    handleSaveEmail,
    handleResetPassword,
  } = useUserSettings(open);

  const disabledInputStyles = {
    '& .MuiInputBase-input.Mui-disabled': {
      cursor: 'text',
      WebkitTextFillColor: theme.palette.text.primary,
      color: theme.palette.text.primary,
      opacity: 1,
    },
  };

  if (!user) return null;

  if (verificationEmailInfo) {
    return (
      <Box component="form" sx={{ mt: 1, textAlign: 'center' }}>
        <OutgoingMail color="primary" sx={{ fontSize: '8rem' }} />
        <Typography sx={{ fontWeight: 500, fontSize: '1.5rem' }}>
          {t('auth:settings.verification.title')}
        </Typography>
        <Typography>{t('auth:settings.verification.sent')}</Typography>
        <Typography mt={4} mb={2}>
          {t('auth:settings.verification.confirm')}
        </Typography>
        {showEmailConfirmationButton && (
          <Button
            color="primary"
            variant="contained"
            onClick={() => setVerificationEmailInfo(false)}
          >
            {t('auth:settings.verification.ok')}
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box component="form" sx={{ mt: 1 }}>
      <Typography sx={{ mb: 2 }} variant="subtitle2" gutterBottom>
        {t('auth:settings.basicInfo')}
      </Typography>

      <TextField
        label={t('auth:settings.username')}
        size="small"
        fullWidth
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        disabled={!usernameEditMode}
        error={Boolean(fieldsErrors['name'])}
        helperText={fieldsErrors['name']}
        sx={disabledInputStyles}
        slotProps={{ input: { readOnly: !usernameEditMode } }}
      />
      <Box sx={{ mt: 2, mb: 2 }}>
        {!usernameEditMode ? (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setUsernameEditMode(true)}
          >
            {t('auth:settings.editUsername')}
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              disabled={isUsernameLoading}
              sx={{ mr: 2 }}
              onClick={handleCancelUsername}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSaveUsername}
              loading={isUsernameLoading}
            >
              {t('common:buttons.save')}
            </Button>
          </>
        )}
      </Box>

      <TextField
        label={t('auth:settings.email')}
        type="email"
        size="small"
        fullWidth
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={!emailEditMode}
        error={Boolean(fieldsErrors['email'])}
        helperText={fieldsErrors['email']}
        sx={disabledInputStyles}
        slotProps={{ input: { readOnly: !emailEditMode } }}
      />
      <Box sx={{ mt: 2 }}>
        {!emailEditMode ? (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setEmailEditMode(true)}
          >
            {t('auth:settings.editEmail')}
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              disabled={isEmailLoading}
              sx={{ mr: 2 }}
              onClick={handleCancelEmail}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSaveEmail}
              loading={isEmailLoading}
            >
              {t('common:buttons.save')}
            </Button>
          </>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" mb={2}>
        {t('auth:settings.passwordChange')}
      </Typography>
      <Button variant="outlined" size="small" onClick={handleResetPassword}>
        {t('auth:settings.resetPassword')}
      </Button>
    </Box>
  );
};

interface UserSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const UserSettingsDialog: React.FC<UserSettingsDialogProps> = ({
  open,
  onClose,
}) => {
  const { t } = useTranslation(['auth']);

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={t('auth:settings.title')}
      showConfirm={false}
    >
      <UserSettingsBase open={open} />
    </BaseDialog>
  );
};
