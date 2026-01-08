import React, { useState } from 'react';
import { login } from '../../services/auth';
import TextField from '@mui/material/TextField';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  alpha,
  Typography,
} from '@mui/material';
import ForgotPassword from './ForgotPassword';
import { getRules, validateField } from './validation';
import { default as LogoIcon } from '@mui/icons-material/TokenOutlined';
import useLoading from '../../hooks/useLoading';
import {
  Brightness4,
  Brightness7,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import AppFooter from '../../components/Footer';
import { useColorMode } from '../../context/ThemeContext';

type FormValues = {
  email: string;
  password: string;
};

const Login = () => {
  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  const [values, setValues] = useState<FormValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { mode, toggleColorMode } = useColorMode();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateInputs = () => {
    const newErrors: Partial<Record<keyof FormValues, string>> = {};
    Object.keys(values).forEach((key) => {
      const field = key as keyof FormValues;
      const error = validateField(values[field], getRules(field));
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    setError('');
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    startActionLoading();
    try {
      await login(values.email, values.password);

      setValues({ email: '', password: '' });
      setErrors({});
      setError('');
    } catch (error: any) {
      console.error('Login error:', error);
      const msg = error.message || '';
      const status = error.status;

      if (msg === 'Invalid login credentials' || status === 400) {
        setError('Niepoprawny email lub hasło.');
      } else if (msg.includes('Email not confirmed')) {
        setError(
          'Twój adres email nie został jeszcze potwierdzony. Sprawdź skrzynkę odbiorczą.'
        );
      } else if (status === 429 || msg.includes('Too many requests')) {
        setError(
          'Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za chwilę.'
        );
      } else if (
        msg.includes('Network request failed') ||
        msg.includes('fetch failed') ||
        msg.includes('network')
      ) {
        setError('Problem z połączeniem. Sprawdź swój internet.');
      } else if (status >= 500) {
        setError('Wystąpił błąd po stronie serwera. Spróbuj ponownie później.');
      } else {
        setError('Wystąpił nieoczekiwany błąd podczas logowania.');
      }
    } finally {
      stopActionLoading();
    }
  };

  return (
    <Box
      component="section"
      className="relative h-screen w-full overflow-hidden"
      sx={(theme) => ({
        background: theme.palette.background.gradient,
      })}
    >
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
      <Box sx={{ position: 'relative', zIndex: 1, height: '100%' }}>
        <Box className="flex h-screen flex-col">
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
            className="flex flex-col items-center justify-center py-8"
            sx={{
              flexGrow: 1,
              px: { xs: 2, sm: 4 },
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
                  color="textPrimary"
                >
                  manager
                </Typography>
              </Typography>
              <Typography variant="h2" className="mt-6 mb-8 text-xl">
                Zaloguj się do swojego konta
              </Typography>

              <form className="space-y-4" noValidate onSubmit={handleSubmit}>
                <TextField
                  size="small"
                  error={!!errors.email}
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  name="email"
                  autoFocus
                  helperText={errors.email}
                  value={values.email}
                  onChange={handleChange}
                  disabled={actionLoading}
                  slotProps={{
                    input: { className: 'rounded-lg' },
                  }}
                />
                <TextField
                  size="small"
                  error={!!errors.password}
                  required
                  fullWidth
                  name="password"
                  label="Hasło"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  helperText={errors.password}
                  value={values.password}
                  onChange={handleChange}
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

                {error && <Alert severity="error">{error}</Alert>}

                <div>
                  <Button
                    onClick={() => setForgotOpen(true)}
                    variant="text"
                    sx={(theme) => ({
                      color: theme.palette.primary.main,
                      p: 0,
                      '&:hover': {
                        textDecoration: 'underline',
                        background: 'transparent',
                      },
                    })}
                  >
                    Nie pamiętasz hasła?
                  </Button>
                </div>
                <Typography variant="caption">
                  {`Logując się, akceptujesz `}
                  <Link
                    href="/regulamin.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Zasady użytkowania systemu
                  </Link>
                  {` oraz potwierdzasz zapoznanie się z `}
                  <Link
                    href="/rodo.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Informacją o przetwarzaniu danych (RODO)
                  </Link>
                  .
                </Typography>

                <Button
                  type="submit"
                  loading={actionLoading}
                  variant="contained"
                  sx={(theme) => ({
                    width: '100%',
                    border: `1px solid ${theme.palette.text.primary}`,
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    mt: 2,
                    py: 1.5,
                    '&:hover': {
                      boxShadow: 'none',
                      background: theme.palette.secondary.main,
                      color: theme.palette.secondary.contrastText,
                      borderColor: theme.palette.secondary.contrastText,
                    },
                  })}
                >
                  Zaloguj się
                </Button>
              </form>

              <ForgotPassword
                open={forgotOpen}
                handleClose={() => setForgotOpen(false)}
              />
            </Box>
          </Box>

          <AppFooter />
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
