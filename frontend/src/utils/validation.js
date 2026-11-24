// Client-side validation rules. They mirror the backend validators
// (backend/src/validators/user.validators.js) so users get the same rules instantly,
// but they only improve usability: the backend still checks everything.
// Each function returns an error message, or '' when the value is valid.

export const USERNAME_PATTERN = /^[A-Za-z0-9_.-]+$/;
// Same simple check as the backend's Mongoose models.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// bcrypt only uses the first 72 bytes, so the backend caps passwords at 72.
export const PASSWORD_MAX = 72;

export function validateUsername(value) {
  const v = value.trim();
  if (!v) return 'Username is required';
  if (v.length < 3 || v.length > 30) return 'Username must be 3-30 characters';
  if (!USERNAME_PATTERN.test(v)) return 'Username may only contain letters, numbers, _ . and -';
  return '';
}

export function validateEmail(value) {
  const v = value.trim();
  if (!v) return 'Email is required';
  if (v.length > 254) return 'Email is too long';
  if (!EMAIL_PATTERN.test(v)) return 'Enter a valid email address (e.g. name@example.com)';
  return '';
}

// Signup password rules. Passwords are never trimmed (a space is a valid character).
export function validateNewPassword(value) {
  if (!value) return 'Password is required';
  if (value.length < 8 || value.length > PASSWORD_MAX) return `Password must be 8-${PASSWORD_MAX} characters`;
  if (!/[A-Za-z]/.test(value)) return 'Password must contain at least one letter';
  if (!/\d/.test(value)) return 'Password must contain at least one number';
  return '';
}

export function validateConfirmPassword(confirm, password) {
  if (!confirm) return 'Please confirm your password';
  if (confirm !== password) return 'Passwords do not match';
  return '';
}

// Login: one field that accepts a username OR an email.
export function validateLoginIdentifier(value) {
  const v = value.trim();
  if (!v) return 'Username or email is required';
  if (v.includes('@')) return EMAIL_PATTERN.test(v) ? '' : 'Enter a valid email address';
  if (v.length > 30) return 'Username is too long';
  return '';
}

export function validateLoginPassword(value) {
  if (!value) return 'Password is required';
  if (value.length > PASSWORD_MAX) return 'Password is too long';
  return '';
}
