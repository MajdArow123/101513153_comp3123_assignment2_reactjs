// Shared card layout for the Login and Signup pages.
import { Avatar, Box, Paper, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

function AuthLayout({ title, subtitle, children }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 1, sm: 4 } }}>
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 440 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mb: 1 }}>
            <LockOutlinedIcon aria-hidden="true" />
          </Avatar>
          <Typography variant="h1" sx={{ fontSize: '1.6rem' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography color="text.secondary" sx={{ mt: 0.5, textAlign: 'center' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {children}
      </Paper>
    </Box>
  );
}

export default AuthLayout;
