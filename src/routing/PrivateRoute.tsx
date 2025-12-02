import { Navigate, Outlet } from 'react-router-dom';
import Loading from '../components/Loading';
import type { User } from '@supabase/supabase-js';
interface PrivateRouteProps {
  isLoading: boolean;
  user: User | null;
}

const PrivateRoute = ({ isLoading, user }: PrivateRouteProps) => {
  if (isLoading) {
    return <Loading fullScreen />;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
