// Wraps every page that needs a logged-in user.
// Not logged in -> go to /login, remembering where the user wanted to go (state.from),
// so the login page can send them back there afterwards.
// replace: the protected URL is replaced in history, so Back doesn't loop back to it.
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // <Outlet /> renders the child route (the actual page).
  return <Outlet />;
}

export default ProtectedRoute;
