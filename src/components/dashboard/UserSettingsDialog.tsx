import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  useTheme
} from '@mui/material';
import { OutgoingMail } from '@mui/icons-material';
import { updateDisplayName as updateNameService, updateEmail as updateEmailService } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import BaseDialog from '../BaseDialog';
import useNotifications from '../../hooks/useNotifications/useNotifications';
import { useNavigate } from 'react-router-dom';

interface UserSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const UserSettingsDialog: React.FC<UserSettingsDialogProps> = ({
  open,
  onClose,
}) => {
  const { user } = useAuth();
  const notifications = useNotifications();
  const theme = useTheme();

  const [emailEditMode, setEmailEditMode] = useState(false);
  const [usernameEditMode, setUsernameEditMode] = useState(false);
  const [verificationEmailInfo, setVerificationEmailInfo] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
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
  }, [open]);

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
  }, [user]);

  const updateDisplayName = async (): Promise<boolean> => {
    if (!user) return false;

    const currentName = user.user_metadata?.display_name || '';
    if (displayName !== currentName) {
      try {
        await updateNameService(displayName.trim());
        return true;
      } catch (error) {
        console.error('Update name error:', error);
        return false;
      }
    }
    return false;
  };

  const updateUserEmail = async (): Promise<boolean> => {
    if (!user) return false;

    if (email === user.email) return false;

    if (!email) {
      setFieldsError((prev) => ({ ...prev, email: 'Wprowadź adres email.' }));
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
      notifications.show(error.message || 'Błąd zmiany emaila', { severity: 'error' });
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

    setLoading(true);
    setFieldsError({});

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
      setLoading(false);
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

    setLoading(true);
    setFieldsError({});

    try {
      const currentName = user.user_metadata?.display_name || '';
      const hasDisplayNameChanged = displayName !== currentName;

      if (!hasDisplayNameChanged) {
        return;
      }

      if (await updateDisplayName()) {
        notifications.show('Pomyślnie zaktualizowano nazwę użytkownika', {
          severity: 'success',
          autoHideDuration: 5000,
        });
        handleClose();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      notifications.show('Wystąpił błąd podczas aktualizacji danych', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    } finally {
      setLoading(false);
      setUsernameEditMode(false);
    }
  };

  const handleClose = (): void => {
    onClose();
  };

  if (!user) {
    return null;
  }

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title="Ustawienia konta"
      showConfirm={false}
    >
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
            Na podany adres email został wysłany link aktywacyjny.
          </Typography>
          <Typography mt={4} mb={2}>
            Potwierdź nowego maila, aby dokonać zmiany.
          </Typography>
        </Box>
      ) : (
        <Box component="form" sx={{ mt: 1 }}>
          <Typography sx={{ fontWeight: 500, fontSize: '1.1rem' }} variant="body1" gutterBottom>
            Informacje podstawowe
          </Typography>

          <Typography>
            Nazwa użytkownika:
          </Typography>
          <TextField
            size="small"
            slotProps={{
              input: {
                readOnly: !usernameEditMode,
              },
            }}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            fullWidth
            disabled={loading || !usernameEditMode}
            sx={disabledInputStyles}
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
                size='small'
                onClick={() => setUsernameEditMode(true)}
                loading={loading}
              >
                Edytuj nazwę użytkownika
              </Button>
            )}
            {usernameEditMode && (
              <>
                <Button
                  variant="outlined"
                  size='small'
                  color="inherit"
                  loading={loading}

                  sx={{ mr: 2 }}
                  onClick={() => {
                    setDisplayName(user.user_metadata?.display_name || '');
                    setUsernameEditMode(false);
                  }}
                >
                  Anuluj
                </Button>

                <Button
                  variant="contained"
                  size='small'
                  onClick={handleSaveUsername}
                  loading={loading}
                >
                  Zapisz
                </Button>
              </>
            )}
          </Box>


          <Typography>
            Email:
          </Typography>
          <TextField
            size="small"
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
            disabled={loading || !emailEditMode}
            sx={disabledInputStyles}
          />

          <Box sx={{ mt: 2 }}>
            {!emailEditMode && (
              <Button
                loading={loading}
                variant="outlined"
                size='small'
                onClick={() => setEmailEditMode(true)}
              >
                Edytuj adres email
              </Button>
            )}
            {emailEditMode && (
              <>
                <Button
                  variant="outlined"
                  size='small'
                  color="inherit"
                  loading={loading}
                  sx={{ mr: 2 }}
                  onClick={() => {
                    setEmail(user.email || '');
                    setEmailEditMode(false);
                  }}
                >
                  Anuluj
                </Button>

                <Button
                  variant="contained"
                  size='small'
                  onClick={handleSaveEmail}
                  loading={loading}
                >
                  Zapisz
                </Button>
              </>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body1" mb={2} sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
            Zmiana hasła
          </Typography>

          <Button
            variant="outlined"
            size='small'
            onClick={() => navigate('/reset-password')}
            loading={loading}
          >
            Resetuj hasło
          </Button>
        </Box>
      )}
    </BaseDialog>
  );
};

export default UserSettingsDialog;
