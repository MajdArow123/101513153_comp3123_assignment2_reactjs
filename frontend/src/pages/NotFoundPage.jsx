// Shown for any URL that doesn't match a route (the "*" route in App.jsx).
import { Link as RouterLink } from 'react-router-dom';
import { Button, Paper, Typography } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { useAuth } from '../context/AuthContext';

function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <Paper sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center', maxWidth: 520, mx: 'auto', mt: 4 }}>
      <SearchOffIcon color="action" sx={{ fontSize: 56 }} aria-hidden="true" />
      <Typography variant="h1" sx={{ mt: 1 }}>
        Page not found
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        The page you are looking for doesn&apos;t exist or has moved.
      </Typography>
      <Button
        variant="contained"
        component={RouterLink}
        to={isAuthenticated ? '/employees' : '/login'}
        sx={{ mt: 3 }}
      >
        {isAuthenticated ? 'Back to employees' : 'Go to login'}
      </Button>
    </Paper>
  );
}

export default NotFoundPage;
