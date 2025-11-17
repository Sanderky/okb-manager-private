import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  IconButton,
  InputAdornment,
  Collapse,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  updatePassword,
  updateEmail,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  type User,
} from 'firebase/auth';
import { auth } from '../../firebase';
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
  const user = auth.currentUser;
  const notifications = useNotifications();

  const [editMode, setEditMode] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [fieldsErrors, setFieldsError] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user && open) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setPassword('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // setError('');
      setEditMode(false);
      // setSuccess('');
      setFieldsError({});
    }
  }, [user, open]);

  const reauthenticate = async (currentPassword: string): Promise<boolean> => {
    if (!user || !user.email) return false;

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error) {
      console.error('User authentication error:', error);
      return false;
    }
  };

  const updateDisplayName = async (): Promise<boolean> => {
    if (!user) return false;

    if (displayName !== user.displayName) {
      await updateProfile(user, {
        displayName: displayName.trim(),
      });
      return true;
    }
    return false;
  };

  const updateUserEmail = async (): Promise<boolean> => {
    let result = true;
    if (!user || email === user.email) result = false;

    if (!email) {
      setFieldsError((prev) => ({
        ...prev,
        email: 'Należy wprowadzić adres email.',
      }));
      result = false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setFieldsError((prev) => ({
        ...prev,
        email: 'Nieprawidłowy format adresu email.',
      }));
      result = false;
    }

    if (!password) {
      setFieldsError((prev) => ({
        ...prev,
        password: 'Obecne hasło jest wymagane do zmiany emaila.',
      }));
      result = false;
    }

    if (result && user) {
      if (await reauthenticate(password)) {
        await updateEmail(user, email.trim());
      } else {
        setFieldsError((prev) => ({
          ...prev,
          password: 'Wprowadzono nieprawidłowe hasło',
        }));
        result = false;
      }
    }
    return result;
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
        await updatePassword(user as User, newPassword);
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

  const handleSave = async (): Promise<void> => {
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
      const hasDisplayNameChanged = displayName !== user.displayName;
      const hasEmailChanged = email !== user.email;
      const hasPasswordChanged = !!newPassword;
      let result = false;

      if (!hasDisplayNameChanged && !hasEmailChanged && !hasPasswordChanged) {
        return;
      }

      if (hasDisplayNameChanged && (await updateDisplayName())) result = true;

      if (hasEmailChanged && (await updateUserEmail())) result = true;

      if (result) {
        notifications.show('Pomyślnie zaktualizowano dane użytkownika', {
          severity: 'success',
          autoHideDuration: 5000,
        });
        setPassword('');
        setEditMode(false);
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

      notifications.show('Użytkownik nie jest zalogowany', {
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
      <Box component="form" sx={{ mt: 1 }}>
        <Typography variant="body1" gutterBottom>
          Informacje podstawowe
        </Typography>

        <TextField
          size="small"
          label="Nazwa użytkownika"
          slotProps={{
            input: {
              readOnly: !editMode,
            },
          }}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          fullWidth
          margin="normal"
          disabled={loading || !editMode}
        />

        <TextField
          size="small"
          label="Email"
          type="email"
          slotProps={{
            input: {
              readOnly: !editMode,
            },
          }}
          error={Boolean(fieldsErrors['email'])}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          helperText={fieldsErrors['email']}
          margin="normal"
          disabled={loading || !editMode}
        />

        <Collapse in={editMode}>
          <TextField
            size="small"
            label="Hasło"
            error={Boolean(fieldsErrors['password'])}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            disabled={loading}
            helperText={fieldsErrors['password']}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
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
            Aby zmienić adres email należy również wprowadzić obecne hasło
          </Typography>
        </Collapse>

        {!editMode && (
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => setEditMode(true)}
          >
            Edytuj
          </Button>
        )}
        {editMode && (
          <>
            <Button
              variant="outlined"
              color="inherit"
              className="border-gray-400"
              sx={{ mr: 2 }}
              onClick={() => setEditMode(false)}
            >
              Anuluj
            </Button>

            <Button variant="contained" onClick={handleSave} loading={loading}>
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
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
    </BaseDialog>
  );
};

export default UserSettingsDialog;
