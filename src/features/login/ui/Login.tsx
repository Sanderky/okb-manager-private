import React, { useState } from 'react';
import { AuthApi } from '@/entities/session';
import TextField from '@mui/material/TextField';
import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  Link,
  Typography,
} from '@mui/material';
import { getRules, validateField } from '@/entities/session';
import useLoading from '@/shared/lib/useLoading';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/shared/api/mock/mockDb';

const RODO_URL = import.meta.env.VITE_RODO_URL ?? '';
const isMock = import.meta.env.VITE_USE_MOCK === 'true';

type FormValues = {
  email: string;
  password: string;
};

interface LoginProps {
  onForgotPassword: () => void;
}

export const Login = ({ onForgotPassword }: LoginProps) => {
  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  const [values, setValues] = useState<FormValues>({
    email: isMock ? DEMO_EMAIL : '',
    password: isMock ? DEMO_PASSWORD : '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      await AuthApi.login(values.email, values.password);

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
          onClick={() => onForgotPassword()}
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
        {`Logując się, akceptujesz oraz potwierdzasz zapoznanie się z `}
        <Link href={RODO_URL} target="_blank" rel="noopener noreferrer">
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
  );
};
