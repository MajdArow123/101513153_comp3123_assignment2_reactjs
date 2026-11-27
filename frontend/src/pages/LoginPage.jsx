// Login screen: one "Username or email" field plus a password.
// Controlled components: React state is the single source of truth for every input.
import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Alert, Box, Button, CircularProgress, Link, TextField, Typography } from '@mui/material';

import AuthLayout from '../components/AuthLayout';
import PasswordField from '../components/PasswordField';
import { login as loginRequest } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { validateLoginIdentifier, validateLoginPassword } from '../utils/validation';

const VALIDATORS = {
  identifier: validateLoginIdentifier,
  password: validateLoginPassword,
};

function LoginPage() {
  const location = useLocation();
  // logoutMessage: why we were sent here, e.g. "Your session has expired" (set by AuthContext).
  const { login, logoutMessage } = useAuth();
  const notify = useNotify();
  usePageTitle('Log in');

  // Pre-filled after signup (the signup page passes the new username).
  const [values, setValues] = useState({ identifier: location.state?.username || '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const mutation = useMutation({ mutationFn: loginRequest });

  const validateField = (name, value) => VALIDATORS[name](value);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    // If this field is already showing an error, re-check it live so it clears as soon as it's fixed.
    if (errors[name]) setErrors((current) => ({ ...current, [name]: validateField(name, value) }));
  };

  // Validate when the user leaves a field (not on every keystroke, which feels naggy).
  const handleBlur = (event) => {
    const { name, value } = event.target;
    setErrors((current) => ({ ...current, [name]: validateField(name, value) }));
  };

  const handleSubmit = (event) => {
    event.preventDefault(); // stop the browser's normal form submit (full page reload)
    setFormError('');

    const newErrors = {
      identifier: validateField('identifier', values.identifier),
      password: validateField('password', values.password),
    };
    setErrors(newErrors);
    if (newErrors.identifier || newErrors.password) return;

    // The backend wants exactly one of username OR email, so we decide by the "@".
    // (Usernames can't contain "@", so this is never ambiguous.)
    const identifier = values.identifier.trim();
    const credentials = identifier.includes('@')
      ? { email: identifier, password: values.password }
      : { username: identifier, password: values.password };

    mutation.mutate(credentials, {
      onSuccess: (data) => {
        // Saving the session is enough: PublicOnlyRoute then sees we're logged in and
        // redirects to the page the user originally asked for (or the employee list).
        login(data.token, data.user);
        notify(`Welcome back, ${data.user.username}!`);
      },
      onError: (error) => {
        setFormError(getErrorMessage(error, { 401: 'Invalid username/email or password' }));
        // Backend field names are username/email/password; our form calls the first one "identifier".
        const fieldErrors = getFieldErrors(error);
        setErrors({
          identifier: fieldErrors.username || fieldErrors.email || '',
          password: fieldErrors.password || '',
        });
      },
    });
  };

  const isSubmitting = mutation.isPending;

  return (
    <AuthLayout title="Log in" subtitle="Manage your employees">
      {logoutMessage && !formError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {logoutMessage}
        </Alert>
      )}
      {/* role="alert" (built into Alert) makes screen readers announce the error. */}
      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          id="login-identifier"
          name="identifier"
          label="Username or email"
          value={values.identifier}
          onChange={handleChange}
          onBlur={handleBlur}
          error={Boolean(errors.identifier)}
          helperText={errors.identifier || ' '}
          autoComplete="username"
          autoFocus
          required
          fullWidth
          margin="dense"
        />
        <PasswordField
          id="login-password"
          name="password"
          label="Password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={Boolean(errors.password)}
          helperText={errors.password || ' '}
          autoComplete="current-password"
          required
          fullWidth
          margin="dense"
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
          sx={{ mt: 1 }}
        >
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
        Don&apos;t have an account?{' '}
        <Link component={RouterLink} to="/signup">
          Sign up
        </Link>
      </Typography>
    </AuthLayout>
  );
}

export default LoginPage;
