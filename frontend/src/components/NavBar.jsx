// Top navigation bar. Its links depend on whether the user is logged in,
// and on phones and tablets they collapse into a menu button.
import { useState } from 'react';
import { Link as RouterLink, NavLink } from 'react-router-dom';
import { AppBar, Box, Button, Divider, IconButton, Menu, MenuItem, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';

// Highlights the link of the page we are on (NavLink adds the "active" class).
const navButtonSx = {
  color: 'inherit',
  '&.active': { backgroundColor: 'rgba(255, 255, 255, 0.16)' },
};

function NavBar() {
  const { isAuthenticated, user, logout } = useAuth();
  const notify = useNotify();
  const theme = useTheme();
  // Below 900 px ("md") the links + username don't fit next to the title, so use a menu.
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [menuAnchor, setMenuAnchor] = useState(null);

  // `end` on /employees: don't also highlight it while on /employees/add.
  const links = isAuthenticated
    ? [
        { to: '/employees', label: 'Employees', end: true },
        { to: '/employees/add', label: 'Add Employee' },
      ]
    : [
        { to: '/login', label: 'Login' },
        { to: '/signup', label: 'Sign up' },
      ];

  const closeMenu = () => setMenuAnchor(null);
  const handleLogout = () => {
    closeMenu();
    logout();
    notify('You have been logged out.', 'info');
  };

  return (
    <AppBar position="sticky" color="primary">
      <Toolbar sx={{ gap: 1 }}>
        <PeopleAltIcon aria-hidden="true" />
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ color: 'inherit', textDecoration: 'none', fontWeight: 700, flexGrow: 1, fontSize: { xs: '1rem', sm: '1.2rem' } }}
        >
          Employee Management App
        </Typography>

        {isMobile ? (
          <>
            <IconButton
              color="inherit"
              aria-label="Open navigation menu"
              aria-controls={menuAnchor ? 'nav-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(menuAnchor)}
              onClick={(event) => setMenuAnchor(event.currentTarget)}
            >
              <MenuIcon />
            </IconButton>
            <Menu id="nav-menu" anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
              {isAuthenticated && user && (
                <MenuItem disabled>Signed in as {user.username}</MenuItem>
              )}
              {isAuthenticated && <Divider />}
              {links.map((link) => (
                <MenuItem key={link.to} component={NavLink} to={link.to} end={link.end} onClick={closeMenu}>
                  {link.label}
                </MenuItem>
              ))}
              {isAuthenticated && <MenuItem onClick={handleLogout}>Logout</MenuItem>}
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {links.map((link) => (
              <Button key={link.to} component={NavLink} to={link.to} end={link.end} sx={navButtonSx}>
                {link.label}
              </Button>
            ))}
            {isAuthenticated && (
              <>
                {user && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mx: 1, opacity: 0.9 }}>
                    <AccountCircleIcon fontSize="small" aria-hidden="true" />
                    <Typography variant="body2">{user.username}</Typography>
                  </Box>
                )}
                <Button variant="outlined" color="inherit" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default NavBar;
