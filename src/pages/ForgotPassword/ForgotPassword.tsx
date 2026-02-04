import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { updatePassword } from '../../api/auth';
import TextField from '@mui/material/TextField';
import {
  Box,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  Stack,
  alpha,
} from '@mui/material';
import { default as LogoIcon } from '@mui/icons-material/TokenOutlined';
import useLoading from '../../hooks/useLoading';
import {
  ArrowBack,
  Brightness4,
  Brightness7,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { getRules, validateField } from '../Login/validation';
import AppFooter from '../../components/Footer';
import { useColorMode } from '../../context/ThemeContext';

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mode, toggleColorMode } = useColorMode();
  const showBackButton = searchParams.get('ref') === 'settings';
  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');

    let hasError = false;

    const validationError = validateField(password, getRules('password'));
    if (validationError) {
      setPasswordError(validationError);
      hasError = true;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Hasła nie są identyczne.');
      hasError = true;
    }

    if (hasError) return;

    startActionLoading();
    try {
      await updatePassword(password);
      navigate('/home');
    } catch (err: any) {
      console.error('Update password error:', err);

      const msg = err.message || '';

      if (msg.includes('Password should be at least')) {
        setPasswordError('Hasło jest za krótkie (minimum 6 znaków).');
      } else if (msg.includes('different from the old password')) {
        setGeneralError('Nowe hasło musi różnić się od starego hasła.');
      } else if (
        msg.includes('Auth session missing') ||
        msg.includes('User not authenticated') ||
        err.status === 401 ||
        err.status === 403
      ) {
        setGeneralError(
          'Link resetujący wygasł lub jest nieprawidłowy. Poproś o zmianę hasła ponownie.'
        );
      } else if (err.status === 429) {
        setGeneralError('Zbyt wiele prób. Odczekaj chwilę.');
      } else if (
        msg.includes('Network request failed') ||
        msg.includes('fetch failed')
      ) {
        setGeneralError('Błąd połączenia. Sprawdź internet.');
      } else {
        setGeneralError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
      }
    } finally {
      stopActionLoading();
    }
  };

  return (
    <Box
      component="section"
      className="relative flex h-screen w-full flex-col overflow-hidden"
      sx={(theme) => ({
        background: theme.palette.background.gradient,
      })}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          p: 1,
        }}
      >
        <Button
          startIcon={
            mode === 'dark' ? (
              <Brightness7 fontSize="small" />
            ) : (
              <Brightness4 fontSize="small" />
            )
          }
          onClick={toggleColorMode}
          variant="text"
          color="inherit"
          size="small"
        >
          Motyw
        </Button>
      </Box>
      <Box
        sx={(theme) => ({
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: theme.palette.background.grid,
          backgroundSize: '6rem 4rem',
        })}
      />

      <Box
        sx={{ position: 'relative', zIndex: 1, height: '100%' }}
        className="flex h-screen flex-col"
      >
        <Box
          className="flex flex-col items-center justify-center py-8"
          sx={{
            px: { xs: 2, sm: 4 },
            flexGrow: 1,
          }}
        >
          <Box
            className="relative w-full rounded-lg shadow"
            sx={(theme) => ({
              maxWidth: { xs: '100%', sm: '450px' },
              py: 3,
              px: { xs: 2, sm: 3 },
              background: theme.palette.background.paper,
            })}
          >
            <Typography
              variant="h1"
              component={'div'}
              sx={(theme) => ({
                background: alpha(theme.palette.background.paper, 0.5),
              })}
              className="absolute -top-8 left-1/2 mb-6 inline-flex -translate-x-1/2 flex-row items-end justify-center rounded-lg px-4 py-2 font-medium shadow"
            >
              <LogoIcon className="text-4xl" sx={{ color: 'text.primary' }} />
              <Typography
                component={'span'}
                className="text-4xl font-medium text-shadow-sm/20"
                sx={(theme) => ({
                  color: theme.palette.secondary.main,
                })}
              >
                OKB
              </Typography>
              <Typography
                color="textPrimary"
                component={'span'}
                className="text-2xl font-medium underline"
              >
                manager
              </Typography>
            </Typography>

            <Typography variant="h2" className="mt-6 mb-8 text-xl">
              Reset hasła
            </Typography>

            <form className="space-y-6" noValidate onSubmit={handleSubmit}>
              <TextField
                size="small"
                error={!!passwordError}
                required
                fullWidth
                name="password"
                label="Nowe hasło"
                type={showPassword ? 'text' : 'password'}
                id="password"
                helperText={passwordError}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={actionLoading}
                slotProps={{
                  input: {
                    className: 'rounded-lg',
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

              <TextField
                size="small"
                error={!!confirmPasswordError}
                required
                fullWidth
                name="confirmPassword"
                label="Potwierdź hasło"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                helperText={confirmPasswordError}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={actionLoading}
                slotProps={{
                  input: {
                    className: 'rounded-lg',
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                          edge="end"
                        >
                          {showConfirmPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {generalError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {generalError}
                </Alert>
              )}

              <Stack direction="row" justifyContent={'space-between'}>
                {showBackButton && (
                  <Button
                    variant="text"
                    onClick={() => navigate(-1)}
                    color="inherit"
                    startIcon={<ArrowBack />}
                  >
                    Wróć
                  </Button>
                )}

                <Button
                  type="submit"
                  loading={actionLoading}
                  variant="contained"
                  color="primary"
                >
                  Zmień hasło
                </Button>
              </Stack>
            </form>
          </Box>
        </Box>
      </Box>

      <AppFooter />
    </Box>
  );
};

export default UpdatePassword;
