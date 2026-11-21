// Calls to /api/v1/user. Each function returns the "data" part of the
// backend's { status, message, data } response.
import axiosClient from './axiosClient';

// { username, email, password } -> the created user (no token: the user logs in next).
export async function signup(details) {
  const response = await axiosClient.post('/user/signup', details);
  return response.data.data;
}

// { username, password } OR { email, password } -> { token, tokenType, expiresIn, user }
export async function login(credentials) {
  const response = await axiosClient.post('/user/login', credentials);
  return response.data.data;
}
