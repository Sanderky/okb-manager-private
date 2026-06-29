import {
  Box,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  Stack,
  alpha,
  TextField,
} from '@mui/material';
import { default as LogoIcon } from '@mui/icons-material/TokenOutlined';
import { ArrowBack, Visibility, VisibilityOff } from '@mui/icons-material';
import { useResetPasswordService } from '@/features/reset-password';
import { useTranslation } from 'react-i18next';

export const ResetPasswordPage = () => {
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordError,
    confirmPasswordError,
    generalError,
    showBackButton,
    handleBack,
    handleSubmit,
    isLoading,
  } = useResetPasswordService();

  const { t } = useTranslation(['auth', 'common']);

  return (
    <Box
      sx={{ position: 'relative', zIndex: 1, height: '100%' }}
      className="flex h-screen flex-col"
    >
      <Box
        className="flex flex-col items-center justify-center py-8"
        sx={{ px: { xs: 2, sm: 4 }, flexGrow: 1 }}
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
              sx={(theme) => ({ color: theme.palette.secondary.main })}
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
            {t('password.reset')}
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
              disabled={isLoading}
              slotProps={{
                input: {
                  className: 'rounded-lg',
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
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
                  onClick={handleBack}
                  color="inherit"
                  startIcon={<ArrowBack />}
                >
                  {t('common:buttons.back')}
                </Button>
              )}

              <Button
                type="submit"
                loading={isLoading}
                variant="contained"
                color="primary"
              >
                {t('password.changePassword')}
              </Button>
            </Stack>
          </form>
        </Box>
      </Box>
    </Box>
  );
};
