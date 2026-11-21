// One MUI theme for the whole app, so colours, fonts and shapes stay consistent.
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1f4e79' }, // deep navy: the app bar and main buttons
    secondary: { main: '#0f766e' }, // teal accent
    background: { default: '#f4f6f9', paper: '#ffffff' },
  },
  shape: { borderRadius: 10 },
  typography: {
    // System fonts: no extra download, and they look native on every OS.
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '1.9rem', fontWeight: 700 },
    h2: { fontSize: '1.5rem', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      // Normal-case labels read better than ALL CAPS.
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
    },
  },
});

export default theme;
