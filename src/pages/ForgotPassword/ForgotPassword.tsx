import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from '../../services/auth';
import TextField from '@mui/material/TextField';
import {
  Box,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  Stack,
} from '@mui/material';
import { default as LogoIcon } from '@mui/icons-material/TokenOutlined';
import useLoading from '../../hooks/useLoading';
import { ArrowBack, Visibility, VisibilityOff } from '@mui/icons-material';
import { getRules, validateField } from '../Login/validation';
import AppFooter from '../../components/Footer';

const UpdatePassword = () => {
  const navigate = useNavigate();
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

      setGeneralError('Nie udało się zmienić hasła. Spróbuj ponownie.');
    } finally {
      stopActionLoading();
    }
  };

  return (
    <section className="relative bg-(image:--primary-gradient)">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>
      </div>
      <Box className="flex h-screen flex-col">
        <Box
          className="flex flex-col items-center justify-center py-8"
          sx={{
            px: { xs: 2, sm: 4 },
            flexGrow: 1,
          }}
        >
          <Box
            className="relative w-full rounded-lg bg-white shadow"
            sx={{
              maxWidth: { xs: '100%', sm: '450px' },
              py: 3,
              px: { xs: 2, sm: 3 },
            }}
          >
            <h1 className="text-dark absolute -top-8 left-1/2 mb-6 inline-flex -translate-x-1/2 flex-row items-end justify-center rounded-lg bg-white/50 px-4 py-2 font-medium shadow">
              <LogoIcon className="text-4xl" />
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
                component={'span'}
                className="text-2xl font-medium underline"
              >
                manager
              </Typography>
            </h1>

            <h2 className="text-dark mt-6 mb-8 text-xl">Reset hasła</h2>

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
                <Button
                  variant="text"
                  onClick={() => navigate(-1)}
                  color="inherit"
                  startIcon={<ArrowBack />}
                >
                  Wróć
                </Button>

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
        <AppFooter />
      </Box>
    </section>
  );
};

export default UpdatePassword;
