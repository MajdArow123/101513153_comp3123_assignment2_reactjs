// Wraps /login and /signup: a user who is already logged in has no reason to see them.
// This is also what moves the user on right after a successful login: login() updates
// the session, this component re-renders, and it redirects. If ProtectedRoute sent the
// user to /login (state.from), they go back to that page; otherwise to the employee list.
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    const from = location.state?.from;
    const target = from?.pathname ? `${from.pathname}${from.search || ''}` : '/employees';
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
