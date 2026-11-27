// One form shared by "Add Employee" and "Edit Employee".
// - initialValues:     the starting field values (empty for Add, the employee for Edit)
// - currentPictureUrl: the saved picture when editing
// - onSubmit(formData): returns a Promise (the page's mutateAsync); if it rejects,
//                       the form shows the backend's errors
// - onCancel():        called by the Cancel button
import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Divider, Grid, InputAdornment, Paper, TextField } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

import ImagePicker from './ImagePicker';
import { validateEmployeeField } from '../utils/validation';
import { getErrorMessage, getFieldErrors } from '../utils/errors';

const EMPTY_EMPLOYEE = {
  first_name: '',
  last_name: '',
  email: '',
  position: '',
  department: '',
  salary: '',
  date_of_joining: '',
};

const FIELD_NAMES = Object.keys(EMPTY_EMPLOYEE);

// Upload problems come back as a 400 with a message but no per-field errors[]
// (e.g. "Profile picture must be 2 MB or smaller"). Those belong next to the picker.
function isPictureError(error) {
  const data = error?.response?.data;
  return error?.response?.status === 400 && !data?.errors && /picture|file/i.test(data?.message || '');
}

function EmployeeForm({ initialValues = EMPTY_EMPLOYEE, currentPictureUrl, submitLabel = 'Save', onSubmit, onCancel }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [pictureFile, setPictureFile] = useState(null);
  const [pictureError, setPictureError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    // The top message described the last submit; once the user edits, it's out of date.
    setFormError('');
    // Re-check a field that is already showing an error, so it clears once fixed.
    if (errors[name]) setErrors((current) => ({ ...current, [name]: validateEmployeeField(name, value) }));
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setErrors((current) => ({ ...current, [name]: validateEmployeeField(name, value) }));
  };

  const handlePictureChange = (file) => {
    setPictureFile(file);
    setPictureError('');
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const newErrors = {};
    for (const name of FIELD_NAMES) newErrors[name] = validateEmployeeField(name, values[name]);
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      setFormError('Please fix the highlighted fields.');
      return;
    }

    // multipart/form-data: every value is sent as text; the backend converts salary and
    // date. The picture is only added if the user chose a new one.
    const formData = new FormData();
    for (const name of FIELD_NAMES) formData.append(name, values[name].trim());
    if (pictureFile) formData.append('profile_picture', pictureFile);

    setIsSubmitting(true);
    try {
      await onSubmit(formData); // the page navigates away on success
    } catch (error) {
      if (isPictureError(error)) {
        setPictureError(error.response.data.message);
        setFormError('The picture was rejected. Please choose another one.');
      } else {
        setFormError(getErrorMessage(error));
        setErrors((current) => ({ ...current, ...getFieldErrors(error) }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shared props for every text field, so the JSX below stays short.
  const fieldProps = (name, label) => ({
    id: `employee-${name}`,
    name,
    label,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    error: Boolean(errors[name]),
    helperText: errors[name] || ' ',
    disabled: isSubmitting,
    required: true,
    fullWidth: true,
  });

  return (
    <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: { xs: 2, sm: 4 } }}>
      {formError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {formError}
        </Alert>
      )}

      <ImagePicker
        onChange={handlePictureChange}
        onReject={setPictureError}
        currentPictureUrl={currentPictureUrl}
        error={pictureError}
        disabled={isSubmitting}
      />

      <Divider sx={{ my: 3 }} />

      {/* Two columns from "sm" (600 px) up, one column on phones. */}
      <Grid container columnSpacing={2} rowSpacing={1}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField {...fieldProps('first_name', 'First name')} autoComplete="off" autoFocus />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField {...fieldProps('last_name', 'Last name')} autoComplete="off" />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField {...fieldProps('email', 'Email')} type="email" autoComplete="off" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField {...fieldProps('position', 'Position')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField {...fieldProps('department', 'Department')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...fieldProps('salary', 'Salary (CAD)')}
            type="number"
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
              htmlInput: { min: 0.01, step: 0.01, inputMode: 'decimal' },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...fieldProps('date_of_joining', 'Date of joining')}
            type="date"
            // The date input always shows its own placeholder, so keep the label above it.
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" color="inherit" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </Box>
    </Paper>
  );
}

export default EmployeeForm;
