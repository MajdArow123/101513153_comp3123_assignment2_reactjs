// One shared Axios instance for every API call, so the base URL, timeout and
// token handling are configured in a single place.
import axios from 'axios';
import { getStoredToken } from '../utils/session';

// Backend origin as the browser sees it (from .env / the Docker build argument).
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const axiosClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 15000, // 15 s: show an error instead of spinning forever if the server hangs
});

// ---- Request interceptor: attach the JWT ----
// Runs before every request. The token is read from localStorage each time, so a fresh
// login or a logout is picked up immediately.
axiosClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Response interceptor: handle an expired or invalid session ----
// AuthContext registers what to do on a 401 (clear the session, go to /login).
// It lives in React, and this file isn't a component, so it is passed in from there.
let onUnauthorized = null;

export function setOnUnauthorized(handler) {
  onUnauthorized = handler;
}

// On these two, a 401 just means "wrong username or password": the page shows that
// message itself, so we must NOT treat it as an expired session.
const AUTH_ENDPOINTS = ['/user/login', '/user/signup'];

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthRequest = AUTH_ENDPOINTS.some((path) => url.endsWith(path));

    if (status === 401 && !isAuthRequest && onUnauthorized) {
      onUnauthorized();
    }
    // Always pass the error on, so the calling page can still show a message.
    return Promise.reject(error);
  }
);

export default axiosClient;
