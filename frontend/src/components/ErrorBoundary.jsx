// Catches errors thrown while rendering, so one bug shows a friendly message
// instead of a blank white page. Error boundaries must be class components
// (React has no hook for this).
import { Component } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Details only in the developer console during development, never shown to the user.
    if (import.meta.env.DEV) {
      console.error('Render error caught by ErrorBoundary:', error, info.componentStack);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Paper sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center', maxWidth: 520, mx: 'auto', mt: 4 }} role="alert">
        <ErrorOutlineIcon color="error" sx={{ fontSize: 48 }} aria-hidden="true" />
        <Typography variant="h2" component="h1" sx={{ mt: 1 }}>
          Something went wrong
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          This page couldn&apos;t be displayed. Please reload, or go back to the employee list.
        </Typography>
        <Box sx={{ mt: 3, display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload page
          </Button>
          {/* A plain link (full page load) so the app starts fresh. */}
          <Button variant="outlined" href="/employees">
            Go to employees
          </Button>
        </Box>
      </Paper>
    );
  }
}

export default ErrorBoundary;
