import { Navigate, Outlet } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';

interface PrivateRouteProps {
  user: User | null;
}

const PrivateRoute = ({ user }: PrivateRouteProps) => {
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
