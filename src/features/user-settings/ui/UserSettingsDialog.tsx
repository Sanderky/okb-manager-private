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
          Weryfikacja adresu email
        </Typography>
        <Typography>
          Na dwa adresy email (stary i nowy) został wysłany link aktywacyjny.
        </Typography>
        <Typography mt={4} mb={2}>
          Potwierdź nowego maila na obydwóch adresach, aby dokonać zmiany.
        </Typography>
        {showEmailConfirmationButton && (
          <Button
            color="primary"
            variant="contained"
            onClick={() => setVerificationEmailInfo(false)}
          >
            Okej
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box component="form" sx={{ mt: 1 }}>
      <Typography sx={{ mb: 2 }} variant="subtitle2" gutterBottom>
        Informacje podstawowe
      </Typography>

      <TextField
        label="Nazwa użytkownika"
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
            Edytuj nazwę użytkownika
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
              Anuluj
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSaveUsername}
              loading={isUsernameLoading}
            >
              Zapisz
            </Button>
          </>
        )}
      </Box>

      <TextField
        label="Email"
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
            Edytuj adres email
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
              Anuluj
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSaveEmail}
              loading={isEmailLoading}
            >
              Zapisz
            </Button>
          </>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" mb={2}>
        Zmiana hasła
      </Typography>
      <Button variant="outlined" size="small" onClick={handleResetPassword}>
        Resetuj hasło
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
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Ustawienia konta"
      showConfirm={false}
    >
      <UserSettingsBase open={open} />
    </BaseDialog>
  );
};
