import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  useTheme,
} from '@mui/material';
import { OutgoingMail } from '@mui/icons-material';
import {
  updateDisplayName as updateNameService,
  updateEmail as updateEmailService,
} from '../api/auth';
import { useAuth } from '../context/AuthContext';
import BaseDialog from '../shared/ui/BaseDialog';
import useNotifications from '../shared/ui/notifications/useNotifications';
import { useNavigate } from 'react-router-dom';

const getErrorMessage = (error: any): string => {
  const msg = error?.message || error?.error_description || '';

  if (msg.includes('rate limit'))
    return 'Zbyt wiele prób. Spróbuj ponownie później.';
  if (msg.includes('requires a valid email'))
    return 'Podany adres email jest nieprawidłowy.';
  if (msg.includes('already registered') || msg.includes('already in use'))
    return 'Ten adres email jest już zajęty.';
  if (msg.includes('Password')) return 'Hasło jest zbyt słabe.';

  return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.';
};

interface UserSettingsBaseProps {
  open: boolean;
  showEmailConfirmationButton?: boolean;
}
export const UserSettingsBase = ({
  open,
  showEmailConfirmationButton = false,
}: UserSettingsBaseProps) => {
  const { user } = useAuth();
  const notifications = useNotifications();
  const theme = useTheme();

  const [emailEditMode, setEmailEditMode] = useState(false);
  const [usernameEditMode, setUsernameEditMode] = useState(false);
  const [verificationEmailInfo, setVerificationEmailInfo] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  const [mailLoading, setMailLoading] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [fieldsErrors, setFieldsError] = useState<Record<string, string>>({});

  const navigate = useNavigate();

  const disabledInputStyles = {
    '& .MuiInputBase-input.Mui-disabled': {
      cursor: 'text',
      WebkitTextFillColor: theme.palette.text.primary,
      color: theme.palette.text.primary,
      opacity: 1,
    },
  };

  useEffect(() => {
    if (open) {
      const metaName =
        user?.user_metadata?.display_name ||
        user?.user_metadata?.full_name ||
        '';
      setDisplayName(metaName || '');
      setEmail(user?.email || '');
      setEmailEditMode(false);
      setUsernameEditMode(false);
      setVerificationEmailInfo(false);
      setFieldsError({});
    }
  }, [open, user]);

  useEffect(() => {
    if (user) {
      setDisplayName((prev) => {
        if (!usernameEditMode) {
          return (
            user.user_metadata?.display_name ||
            user.user_metadata?.full_name ||
            ''
          );
        }
        return prev;
      });

      setEmail((prev) => {
        if (!emailEditMode) {
          return user.email || '';
        }
        return prev;
      });
    }
  }, [user, emailEditMode, usernameEditMode]);

  const updateDisplayName = async (): Promise<boolean> => {
    if (!user) return false;

    if (!displayName) {
      setFieldsError((prev) => ({
        ...prev,
        name: 'Wprowadź nazwę użytkownika',
      }));

      return false;
    }

    const currentName = user.user_metadata?.display_name || '';
    if (displayName === currentName) {
      setFieldsError((prev) => ({
        ...prev,
        name: 'Nowa nazwa jest taka sama jak stara',
      }));
      return false;
    }
    try {
      await updateNameService(displayName.trim());
      return true;
    } catch (error) {
      console.error('Update name error:', error);
      setFieldsError((prev) => ({ ...prev, name: getErrorMessage(error) }));
      return false;
    }
  };

  const updateUserEmail = async (): Promise<boolean> => {
    if (!user) return false;

    if (email === user.email) {
      setFieldsError((prev) => ({
        ...prev,
        email: 'Nowy email jest taki sam jak stary',
      }));
      return false;
    }

    if (!email) {
      setFieldsError((prev) => ({ ...prev, email: 'Wprowadź adres email' }));
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setFieldsError((prev) => ({
        ...prev,
        email: 'Nieprawidłowy format email.',
      }));
      return false;
    }

    try {
      await updateEmailService(email.trim());
      return true;
    } catch (error: any) {
      console.error('Update email error:', error);
      setFieldsError((prev) => ({ ...prev, email: getErrorMessage(error) }));
      return false;
    }
  };

  const handleSaveEmail = async (): Promise<void> => {
    if (!user) {
      notifications.show('Użytkownik nie jest zalogowany', {
        severity: 'error',
        autoHideDuration: 5000,
      });
      return;
    }

    setMailLoading(true);
    setFieldsError((prev) => ({ ...prev, email: '' }));

    try {
      if (await updateUserEmail()) {
        setVerificationEmailInfo(true);
        setEmailEditMode(false);
      }
    } catch (error) {
      console.error('Error updating email:', error);
      notifications.show('Wystąpił błąd podczas zmiany emaila', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    } finally {
      setMailLoading(false);
    }
  };

  const handleSaveUsername = async (): Promise<void> => {
    if (!user) {
      notifications.show('Użytkownik nie jest zalogowany', {
        severity: 'error',
        autoHideDuration: 5000,
      });
      return;
    }

    setUsernameLoading(true);
    setFieldsError((prev) => ({ ...prev, name: '' }));

    try {
      if (await updateDisplayName()) {
        notifications.show('Pomyślnie zaktualizowano nazwę użytkownika', {
          severity: 'success',
          autoHideDuration: 5000,
        });
        // handleClose();
        setUsernameEditMode(false);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      notifications.show('Wystąpił błąd podczas aktualizacji danych', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    } finally {
      setUsernameLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Box>
      {verificationEmailInfo ? (
        <Box component="form" sx={{ mt: 1, textAlign: 'center' }}>
          <OutgoingMail
            color="primary"
            sx={{
              fontSize: '8rem',
            }}
          />
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '1.5rem',
            }}
          >
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
      ) : (
        <Box component="form" sx={{ mt: 1 }}>
          <Typography sx={{ mb: 2 }} variant="subtitle2" gutterBottom>
            Informacje podstawowe
          </Typography>

          <TextField
            label="Nazwa użytkownika"
            size="small"
            slotProps={{
              input: {
                readOnly: !usernameEditMode,
              },
            }}
            error={Boolean(fieldsErrors['name'])}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            fullWidth
            disabled={!usernameEditMode}
            sx={disabledInputStyles}
            helperText={fieldsErrors['name']}
          />

          <Box
            sx={{
              mt: 2,
              mb: 2,
            }}
          >
            {!usernameEditMode && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setUsernameEditMode(true)}
              >
                Edytuj nazwę użytkownika
              </Button>
            )}
            {usernameEditMode && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  color="inherit"
                  disabled={usernameLoading}
                  sx={{ mr: 2 }}
                  onClick={() => {
                    setFieldsError((prev) => ({ ...prev, name: '' }));
                    setDisplayName(user.user_metadata?.display_name || '');
                    setUsernameEditMode(false);
                  }}
                >
                  Anuluj
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSaveUsername}
                  loading={usernameLoading}
                >
                  Zapisz
                </Button>
              </>
            )}
          </Box>

          <TextField
            size="small"
            label="Email"
            type="email"
            slotProps={{
              input: {
                readOnly: !emailEditMode,
              },
            }}
            error={Boolean(fieldsErrors['email'])}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            helperText={fieldsErrors['email']}
            disabled={!emailEditMode}
            sx={disabledInputStyles}
          />

          <Box sx={{ mt: 2 }}>
            {!emailEditMode && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setEmailEditMode(true)}
              >
                Edytuj adres email
              </Button>
            )}
            {emailEditMode && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  color="inherit"
                  disabled={mailLoading}
                  sx={{ mr: 2 }}
                  onClick={() => {
                    setEmail(user.email || '');
                    setFieldsError((prev) => ({ ...prev, email: '' }));
                    setEmailEditMode(false);
                  }}
                >
                  Anuluj
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSaveEmail}
                  loading={mailLoading}
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

          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/reset-password?ref=settings')}
          >
            Resetuj hasło
          </Button>
        </Box>
      )}
    </Box>
  );
};

interface UserSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const UserSettingsDialog: React.FC<UserSettingsDialogProps> = ({
  open,
  onClose,
}) => {
  const handleClose = (): void => {
    onClose();
  };

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title="Ustawienia konta"
      showConfirm={false}
    >
      <UserSettingsBase open={open} />
    </BaseDialog>
  );
};

export default UserSettingsDialog;
