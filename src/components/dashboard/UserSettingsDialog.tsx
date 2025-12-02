import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { OutgoingMail, Visibility, VisibilityOff } from '@mui/icons-material';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import BaseDialog from '../BaseDialog';
import useNotifications from '../../hooks/useNotifications/useNotifications';

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

  const [emailEditMode, setEmailEditMode] = useState(false);
  const [usernameEditMode, setUsernameEditMode] = useState(false);
  const [verificationEmailInfo, setVerificationEmailInfo] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [fieldsErrors, setFieldsError] = useState<Record<string, string>>({});

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (open) {
      const metaName =
        user?.user_metadata?.display_name ||
        user?.user_metadata?.full_name ||
        '';
      setDisplayName(metaName || '');
      setEmail(user?.email || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
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

  const reauthenticate = async (passwordToCheck: string): Promise<boolean> => {
    if (!user || !user.email) return false;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordToCheck,
      });

      if (error) {
        console.error('Re-auth error:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('User authentication error:', error);
      return false;
    }
  };

  const updateDisplayName = async (): Promise<boolean> => {
    if (!user) return false;

    const currentName = user.user_metadata?.display_name || '';
    if (displayName !== currentName) {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
      });

      if (error) {
        console.error('Update name error:', error);
        return false;
      }
      return true;
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

    const { error } = await supabase.auth.updateUser({
      email: email.trim(),
    });

    if (error) {
      notifications.show(error.message, { severity: 'error' });
      return false;
    }

    return true;
  };

  const updateUserPassword = async (): Promise<boolean> => {
    let result = true;
    if (!newPassword) {
      setFieldsError((prev) => ({
        ...prev,
        newPassword: 'Należy wprowadzić nowe hasło.',
      }));
      result = false;
    }

    if (!currentPassword) {
      setFieldsError((prev) => ({
        ...prev,
        currentPassword: 'Należy wprowadzić obecne hasło.',
      }));
      result = false;
    }

    if (newPassword.length > 0 && newPassword.length < 8) {
      setFieldsError((prev) => ({
        ...prev,
        newPassword: 'Hasło musi zawierać co najmniej 8 znaków.',
      }));
      result = false;
    }
    if (newPassword !== confirmPassword) {
      setFieldsError((prev) => ({
        ...prev,
        newPassword: 'Nowe hasła się różnią.',
        confirmPassword: 'Nowe hasła się różnią.',
      }));
      result = false;
    }

    if (result) {
      if (await reauthenticate(currentPassword)) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          notifications.show(error.message, { severity: 'error' });
          return false;
        }
      } else {
        setFieldsError((prev) => ({
          ...prev,
          currentPassword: 'Wprowadzono nieprawidłowe hasło',
        }));
        result = false;
      }
    }
    return result;
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

  const handleResetPassword = async (): Promise<void> => {
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
      if (await updateUserPassword()) {
        notifications.show('Hasło zostało zresetowane', {
          severity: 'success',
          autoHideDuration: 5000,
        });

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        handleClose();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      notifications.show('Wystąpił błąd podczas zmiany hasła', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    } finally {
      setLoading(false);
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
          <Typography variant="body1" gutterBottom>
            Informacje podstawowe
          </Typography>

          <TextField
            size="small"
            label="Nazwa użytkownika"
            slotProps={{
              input: {
                readOnly: !usernameEditMode,
              },
            }}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            fullWidth
            margin="normal"
            disabled={loading || !usernameEditMode}
          />

          <Box
            sx={{
              mt: 1,
              mb: 2,
            }}
          >
            {!usernameEditMode && (
              <Button
                variant="contained"
                onClick={() => setUsernameEditMode(true)}
              >
                Edytuj nazwę użytkownika
              </Button>
            )}
            {usernameEditMode && (
              <>
                <Button
                  variant="outlined"
                  color="inherit"
                  className="border-gray-400"
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
                  onClick={handleSaveUsername}
                  loading={loading}
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
            margin="normal"
            disabled={loading || !emailEditMode}
          />

          {!emailEditMode && (
            <Button
              variant="contained"
              sx={{ mt: 1 }}
              onClick={() => setEmailEditMode(true)}
            >
              Edytuj adres email
            </Button>
          )}
          {emailEditMode && (
            <>
              <Button
                variant="outlined"
                color="inherit"
                className="border-gray-400"
                sx={{ mr: 2, mt: 1 }}
                onClick={() => {
                  setEmail(user.email || '');
                  setEmailEditMode(false);
                }}
              >
                Anuluj
              </Button>

              <Button
                variant="contained"
                onClick={handleSaveEmail}
                loading={loading}
                sx={{
                  mt: 1,
                }}
              >
                Zapisz
              </Button>
            </>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="body1" gutterBottom>
            Zmiana hasła
          </Typography>

          <TextField
            size="small"
            label="Obecne hasło"
            error={Boolean(fieldsErrors['currentPassword'])}
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
            margin="normal"
            disabled={loading}
            helperText={fieldsErrors['currentPassword']}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Nowe hasło"
            size="small"
            error={Boolean(fieldsErrors['newPassword'])}
            helperText={fieldsErrors['newPassword']}
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            margin="normal"
            disabled={loading}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Potwierdź nowe hasło"
            size="small"
            error={Boolean(fieldsErrors['confirmPassword'])}
            helperText={fieldsErrors['confirmPassword']}
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            margin="normal"
            disabled={loading}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 1, mb: 2 }}
          >
            Hasło musi mieć co najmniej 8 znaków
          </Typography>

          <Button
            variant="contained"
            onClick={handleResetPassword}
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
