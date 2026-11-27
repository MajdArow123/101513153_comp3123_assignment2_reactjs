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

// ---- Employee form ----
// Mirrors backend/src/validators/employee.validators.js and the Employee model.

function requiredText(value, label, max) {
  const v = value.trim();
  if (!v) return `${label} is required`;
  if (v.length > max) return `${label} must be at most ${max} characters`;
  return '';
}

export function validateSalary(value) {
  if (String(value).trim() === '') return 'Salary is required';
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 'Salary must be a number greater than 0';
  if (n > 1_000_000_000) return 'Salary is too large';
  return '';
}

// <input type="date"> gives "YYYY-MM-DD". We also reject impossible dates (e.g. 2024-02-30),
// like the backend's strict ISO 8601 check.
export function validateDateOfJoining(value) {
  if (!value) return 'Date of joining is required';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Enter a valid date';
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return 'Enter a valid date';
  return '';
}

// One function for every employee field, so the form can validate by field name.
export function validateEmployeeField(name, value) {
  switch (name) {
    case 'first_name':
      return requiredText(value, 'First name', 50);
    case 'last_name':
      return requiredText(value, 'Last name', 50);
    case 'email':
      return validateEmail(value);
    case 'position':
      return requiredText(value, 'Position', 100);
    case 'department':
      return requiredText(value, 'Department', 100);
    case 'salary':
      return validateSalary(value);
    case 'date_of_joining':
      return validateDateOfJoining(value);
    default:
      return '';
  }
}

// ---- Profile picture ----
// Same limits as the backend's upload middleware (UPLOAD_MAX_MB defaults to 2).
export const PICTURE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PICTURE_MAX_MB = 2;

export function validatePictureFile(file) {
  if (!PICTURE_TYPES.includes(file.type)) return 'Profile picture must be a JPEG, PNG or WebP image';
  if (file.size > PICTURE_MAX_MB * 1024 * 1024) return `Profile picture must be ${PICTURE_MAX_MB} MB or smaller`;
  return '';
}
