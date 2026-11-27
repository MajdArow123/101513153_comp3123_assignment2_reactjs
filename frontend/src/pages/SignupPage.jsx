// Signup screen. The rules mirror the backend validators; "confirm password" is checked
// here only and is NOT sent (the backend rejects unknown fields).
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Alert, Box, Button, CircularProgress, Link, TextField, Typography } from '@mui/material';

import AuthLayout from '../components/AuthLayout';
import PasswordField from '../components/PasswordField';
import { signup } from '../api/auth.api';
import { useNotify } from '../context/NotificationContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { validateConfirmPassword, validateEmail, validateNewPassword, validateUsername } from '../utils/validation';

const EMPTY = { username: '', email: '', password: '', confirmPassword: '' };

// Validates one field. confirmPassword also needs the password to compare with.
function validateField(name, values) {
  switch (name) {
    case 'username':
      return validateUsername(values.username);
    case 'email':
      return validateEmail(values.email);
    case 'password':
      return validateNewPassword(values.password);
    case 'confirmPassword':
      return validateConfirmPassword(values.confirmPassword, values.password);
    default:
      return '';
  }
}

function SignupPage() {
  const navigate = useNavigate();
  const notify = useNotify();
  usePageTitle('Sign up');

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const mutation = useMutation({ mutationFn: signup });

  const handleChange = (event) => {
    const { name, value } = event.target;
    const next = { ...values, [name]: value };
    setValues(next);

    // Re-check fields that are already showing an error, so it disappears once fixed.
    setErrors((current) => {
      const updated = { ...current };
      if (current[name]) updated[name] = validateField(name, next);
      // Changing the password can fix (or break) the "passwords do not match" error.
      if (name === 'password' && current.confirmPassword) {
        updated.confirmPassword = validateField('confirmPassword', next);
      }
      return updated;
    });
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setErrors((current) => ({ ...current, [name]: validateField(name, values) }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError('');

    const newErrors = {};
    for (const name of Object.keys(EMPTY)) newErrors[name] = validateField(name, values);
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    // Only the three fields the backend accepts (not confirmPassword).
    const details = {
      username: values.username.trim(),
      email: values.email.trim(),
      password: values.password,
    };

    mutation.mutate(details, {
      onSuccess: (user) => {
        // The backend's signup doesn't return a token, so the user logs in next.
        notify('Account created! Please log in.');
        navigate('/login', { state: { username: user.username } });
      },
      onError: (error) => {
        setFormError(getErrorMessage(error, { 409: 'That username or email is already registered' }));

        const fieldErrors = getFieldErrors(error);
        // On 409 the backend lists the duplicate field(s) as "username is already in use".
        if (error.response?.status === 409) {
          if (fieldErrors.username) fieldErrors.username = 'This username is already registered';
          if (fieldErrors.email) fieldErrors.email = 'This email is already registered';
        }
        setErrors((current) => ({ ...current, ...fieldErrors }));
      },
    });
  };

  const isSubmitting = mutation.isPending;

  // Shared props for each field, so the JSX below stays short.
  const fieldProps = (name) => ({
    id: `signup-${name}`,
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    error: Boolean(errors[name]),
    required: true,
    fullWidth: true,
    margin: 'dense',
  });

  return (
    <AuthLayout title="Create an account" subtitle="Sign up to start managing employees">
      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          {...fieldProps('username')}
          label="Username"
          autoComplete="username"
          autoFocus
          helperText={errors.username || '3-30 characters: letters, numbers, _ . -'}
        />
        <TextField
          {...fieldProps('email')}
          label="Email"
          type="email"
          autoComplete="email"
          helperText={errors.email || ' '}
        />
        <PasswordField
          {...fieldProps('password')}
          label="Password"
          autoComplete="new-password"
          helperText={errors.password || 'At least 8 characters, with a letter and a number'}
        />
        <PasswordField
          {...fieldProps('confirmPassword')}
          label="Confirm password"
          autoComplete="new-password"
          helperText={errors.confirmPassword || ' '}
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
          {isSubmitting ? 'Creating account…' : 'Sign up'}
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
        Already have an account?{' '}
        <Link component={RouterLink} to="/login">
          Log in
        </Link>
      </Typography>
    </AuthLayout>
  );
}

export default SignupPage;
