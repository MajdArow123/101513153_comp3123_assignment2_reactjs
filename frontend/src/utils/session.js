// Where the login session is kept in the browser.
// localStorage survives a page refresh (the spec requires that), but any JavaScript on the
// page can read it, so an XSS bug could steal the token. An httpOnly cookie would hide it
// from JavaScript; we use localStorage because the assignment allows it and it is simpler.
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null; // corrupted value: treat as "no user"
  }
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Reads the "exp" (expiry, in seconds) claim from the JWT payload.
// This only DECODES the token, it does not verify it: the browser doesn't have the secret.
// It is just a convenience so we don't show protected pages with a token we know is expired;
// the backend still verifies every request and answers 401 if the token is bad.
export function isTokenExpired(token) {
  try {
    const payloadPart = token.split('.')[1];
    // JWTs use base64url ("-" and "_"); atob expects normal base64 ("+" and "/").
    const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
  } catch {
    return true; // not a readable JWT at all
  }
}
