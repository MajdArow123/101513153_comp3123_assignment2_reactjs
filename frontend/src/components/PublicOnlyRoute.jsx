// Wraps /login and /signup: a user who is already logged in has no reason to see
// them, so they are sent to the employee list instead.
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/employees" replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
