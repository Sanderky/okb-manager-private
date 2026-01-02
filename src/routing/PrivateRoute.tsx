import { Navigate, Outlet } from 'react-router-dom';
import Loading from '../components/Loading';
import type { User } from '@supabase/supabase-js';
import ErrorPage from '../pages/Error/ErrorPage';

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
