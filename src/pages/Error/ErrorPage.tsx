import { ErrorOutline } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';

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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            mr: 2,
          }}
        >
          <ErrorOutline color="error" sx={{ fontSize: '4rem' }} />
        </Box>
        <Box>
          <Typography fontSize={'1.5rem'} gutterBottom>
            Wystąpił niespodziewany błąd.
          </Typography>
          <Typography variant="body1">
            Prosimy spróbować ponownie później.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ErrorPage;
