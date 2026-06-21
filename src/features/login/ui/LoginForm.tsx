import TextField from '@mui/material/TextField';
import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  Link,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useLoginFacade } from '../model/service/useLoginFacade';

const RODO_URL = import.meta.env.VITE_RODO_URL ?? '';

interface LoginProps {
  onForgotPassword: () => void;
}

export const LoginForm = ({ onForgotPassword }: LoginProps) => {
  const {
    values,
    errors,
    error,
    showPassword,
    setShowPassword,
    handleChange,
    handleSubmit,
    isLoading,
  } = useLoginFacade();

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
        disabled={isLoading}
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
        disabled={isLoading}
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
        loading={isLoading}
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
