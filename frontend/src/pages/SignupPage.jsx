// Signup form — built in the next phase.
import { Paper, Typography } from '@mui/material';

function SignupPage() {
  return (
    <Paper sx={{ p: { xs: 2, sm: 4 } }}>
      <Typography variant="h1">Sign up</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        The sign-up form will appear here.
      </Typography>
    </Paper>
  );
}

export default SignupPage;
