import { CircularProgress, Box, Typography } from '@mui/material';

const Loading = ({
  message = 'Ładowanie...',
  size = 40,
  fullScreen = false,
}) => {
  const loadingContent = (
    <Box
      sx={(theme) => ({
        display: 'flex',
        height: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        ...(fullScreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.background.default,
          backgroundImage: theme.palette.background.grid,
          backgroundSize: '6rem 4rem',
          zIndex: 9999,
        }),
      })}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return loadingContent;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: fullScreen ? '100vh' : 'auto',
        width: '100%',
        height: '100%',
      }}
    >
      {loadingContent}
    </Box>
  );
};

export default Loading;
