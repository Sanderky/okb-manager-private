import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const PrivateRoute = () => {
  const { user, initialLoading } = useAuth();

  if (initialLoading) {
    return <Loading fullScreen />;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
