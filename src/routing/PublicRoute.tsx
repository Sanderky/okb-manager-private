import { Navigate, Outlet } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';

interface PublicRouteProps {
  user: User | null;
}

const PublicRoute = ({ user }: PublicRouteProps) => {
  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
