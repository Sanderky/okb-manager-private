import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/auth';
import TextField from '@mui/material/TextField';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import ForgotPassword from './ForgotPassword';
import { getRules, validateField } from './validation';
import { useAuth } from '../../context/AuthContext';
import { default as LogoIcon } from '@mui/icons-material/TokenOutlined';
import Loading from '../../components/Loading';
import useLoading from '../../hooks/useLoading';
import { Visibility, VisibilityOff } from '@mui/icons-material';

type FormValues = {
  email: string;
  password: string;
};

const Login = () => {
  const navigate = useNavigate();
  const { initialLoading, user } = useAuth();
  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  const [values, setValues] = useState<FormValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});
  const [credentialError, setCredentialError] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!initialLoading && user) {
      navigate('/home');
    }
  }, [user, initialLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value });
    if (credentialError) setCredentialError(false);
  };

  const validateInputs = () => {
    const newErrors: Partial<Record<keyof FormValues, string>> = {};
    Object.keys(values).forEach((key) => {
      const field = key as keyof FormValues;
      const error = validateField(values[field], getRules(field));
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    setCredentialError(false);
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
      setCredentialError(false);
    } catch (error: any) {
      console.error('Login error:', error);

      if (
        error.message === 'Invalid login credentials' ||
        error.status === 400
      ) {
        setCredentialError(true);
      } else {
        setCredentialError(true);
      }
    } finally {
      stopActionLoading();
    }
  };

  return (
    <section className="relative bg-(image:--primary-gradient)">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>
      </div>
      {user || initialLoading ? (
        <div className="flex h-screen flex-col items-center justify-center px-6 py-8">
          <Loading
            message={
              initialLoading
                ? 'Sprawdzanie autoryzacji...'
                : 'Przekierowywanie...'
            }
          />
        </div>
      ) : (
        <Box className="flex h-screen flex-col">
          <Box
            className="flex flex-col items-center justify-center py-8"
            sx={{
              flexGrow: 1,
              px: { xs: 2, sm: 4 },
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
              <h2 className="text-dark mt-6 mb-8 text-xl">
                Zaloguj się do swojego konta
              </h2>

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

                {credentialError && (
                  <Alert severity="error">
                    Wprowadzono niepoprawny email lub hasło.
                  </Alert>
                )}

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
                    border: `1px solid darkGray`,
                    background: '#fff',
                    color: theme.palette.text.primary,
                    mt: 2,
                    py: 1.5,
                    '&:hover': {
                      boxShadow: 'none',
                      background: theme.palette.secondary.main,
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

          <footer>
            <Stack
              direction={'row'}
              justifyContent={'space-between'}
              sx={{
                py: 0.25,
                px: 1,
                columnGap: 1,
                rowGap: 1,
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
              }}
              flexWrap={'wrap'}
              className="bg-gray-900/50 text-white"
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: 'inherit',
                }}
              >
                Panel administracyjny dla pracowników. Dostęp tylko dla
                autoryzowanego personelu.
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: 'inherit',
                }}
              >
                &copy; {new Date().getFullYear()},{' '}
                {import.meta.env.VITE_COMPANY_NAME}
              </Typography>
            </Stack>
          </footer>
        </Box>
      )}
    </section>
  );
};

export default Login;
