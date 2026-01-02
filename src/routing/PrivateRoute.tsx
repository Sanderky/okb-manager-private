import { Navigate, Outlet } from 'react-router-dom';
import Loading from '../components/Loading';
import type { User } from '@supabase/supabase-js';
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

interface PrivateRouteProps {
  isLoading: boolean;
  isError: boolean;
  user: User | null;
}

const PrivateRoute = ({ isLoading, isError, user }: PrivateRouteProps) => {
  if (isError) {
    return <ErrorPage />;
  }

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
