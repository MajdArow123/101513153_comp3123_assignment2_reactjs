// Small reusable "state" screens: empty and error. (Loading uses skeletons in each page.)
import { Box, Button, Paper, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';

// Nothing to show yet, e.g. "No employees yet" + an Add button.
// titleComponent: 'h1' when this IS the whole page (e.g. "Employee not found"), so the
// page still has a main heading for screen readers; otherwise a plain paragraph.
export function EmptyState({ icon, title, message, action, titleComponent = 'p' }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
      {icon && <Box sx={{ color: 'text.secondary', mb: 1, '& svg': { fontSize: 48 } }}>{icon}</Box>}
      <Typography variant="h2" component={titleComponent}>
        {title}
      </Typography>
      {message && (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {message}
        </Typography>
      )}
      {action && <Box sx={{ mt: 3 }}>{action}</Box>}
    </Paper>
  );
}

// A request failed. `message` is already user-friendly (from getErrorMessage).
// role="alert" so screen readers announce it.
export function ErrorState({ title = "Couldn't load the data", message, onRetry, action }) {
  return (
    <Paper variant="outlined" role="alert" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
      <ErrorOutlineIcon color="error" sx={{ fontSize: 48 }} aria-hidden="true" />
      <Typography variant="h2" component="p" sx={{ mt: 1 }}>
        {title}
      </Typography>
      {message && (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {message}
        </Typography>
      )}
      <Box sx={{ mt: 3, display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
        {onRetry && (
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={onRetry}>
            Try again
          </Button>
        )}
        {action}
      </Box>
    </Paper>
  );
}
