import { Alert, Box } from '@mui/material';

const ErrorPage = () => {
  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: theme.palette.background.default,
        backgroundImage: theme.palette.background.grid,
        backgroundSize: '6rem 4rem',
      })}
    >
      <Alert severity="error">
        Wystąpił niespodziewany błąd. Prosimy spróbować ponownie później.
      </Alert>
    </Box>
  );
};

export default ErrorPage;
