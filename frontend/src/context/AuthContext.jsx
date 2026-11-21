// Holds the login session (token + user) and shares it with the whole app
// through React Context, so any component can call useAuth().
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { setOnUnauthorized } from '../api/axiosClient';
import { clearSession, getStoredToken, getStoredUser, isTokenExpired, saveSession } from '../utils/session';

const AuthContext = createContext(null);

const SESSION_EXPIRED_MESSAGE = 'Your session has expired, please log in again';

// Runs once when the app loads: restore the session from localStorage so it survives
// a refresh, but drop it straight away if the token has already expired.
function loadInitialSession() {
  const token = getStoredToken();
  if (!token || isTokenExpired(token)) {
    clearSession();
    return { token: null, user: null };
  }
  return { token, user: getStoredUser() };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadInitialSession);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Called by the login page after a successful login.
  const login = useCallback((token, user) => {
    saveSession(token, user);
    setSession({ token, user });
  }, []);

  // Clears everything about the current user. `message` is shown on the login page
  // (e.g. "session expired"). replace: true removes the protected page from history,
  // so the Back button can't return to it.
  const logout = useCallback(
    (message) => {
      clearSession();
      setSession({ token: null, user: null });
      // Remove cached API data, so the next user never sees the previous user's employees.
      queryClient.clear();
      navigate('/login', { replace: true, state: message ? { message } : undefined });
    },
    [navigate, queryClient]
  );

  // Tell the Axios interceptor what to do when the backend answers 401 (token expired,
  // invalid, or tampered with): log out and explain why.
  useEffect(() => {
    setOnUnauthorized(() => logout(SESSION_EXPIRED_MESSAGE));
    return () => setOnUnauthorized(null);
  }, [logout]);

  // Logged in = we have a token that hasn't expired yet. Checked on every render,
  // so a token that expires while the app is open stops counting straight away.
  const isAuthenticated = Boolean(session.token) && !isTokenExpired(session.token);

  // useMemo: only give consumers a new object when something actually changed.
  const value = useMemo(
    () => ({ token: session.token, user: session.user, isAuthenticated, login, logout }),
    [session, isAuthenticated, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The hook lives next to its provider so the two are easy to read together.
// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
