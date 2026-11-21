// Login form — built in the next phase.
// Already shows the message passed on redirect (e.g. "Your session has expired").
import { useLocation } from 'react-router-dom';
import { Alert, Paper, Typography } from '@mui/material';

function LoginPage() {
  const location = useLocation();
  const message = location.state?.message;

  return (
    <Paper sx={{ p: { xs: 2, sm: 4 } }}>
      <Typography variant="h1">Login</Typography>
      {message && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        The login form will appear here.
      </Typography>
    </Paper>
  );
}

export default LoginPage;
