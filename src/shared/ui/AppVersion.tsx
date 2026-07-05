import { Typography } from '@mui/material';

const getVersion = () => {
  const isDemo = import.meta.env.VITE_USE_MOCK === 'true';
  const isDev = import.meta.env.DEV;
  const version = import.meta.env.VITE_APP_VERSION;
  return version + (isDemo ? ' (demo)' : '') + (isDev ? ' (dev)' : '');
};

export const AppVersion = () => {
  return (
    <Typography sx={{ ml: 1 }} variant="caption" color="textSecondary">
      {getVersion()}
    </Typography>
  );
};
