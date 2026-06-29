import { useState } from 'react';
import { Box, alpha, Typography } from '@mui/material';
import { default as LogoIcon } from '@mui/icons-material/TokenOutlined';
import { ForgotPassword } from '@/features/forgot-password';
import { LoginForm } from '@/features/login';
import { useTranslation } from 'react-i18next';

export const LoginPage = () => {
  const [forgotOpen, setForgotOpen] = useState(false);
  const { t } = useTranslation('auth');

  return (
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
          {t('login.login')}
        </Typography>
        <LoginForm onForgotPassword={() => setForgotOpen(true)} />
        <ForgotPassword
          open={forgotOpen}
          handleClose={() => setForgotOpen(false)}
        />
      </Box>
    </Box>
  );
};
