// App entry point: sets up the providers every page relies on, then renders <App />.
// Order matters: AuthProvider uses the router (to redirect) and the query client
// (to clear cached data on logout), so it must sit inside both.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';

import App from './App';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// TanStack Query caches API results and tracks loading/error states for us.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // reuse data for 30 s before refetching
      refetchOnWindowFocus: false, // don't refetch just because the user switched tabs
      // Retry once for network hiccups, but never for 4xx answers (they won't change on retry).
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status && status < 500) return false;
        return failureCount < 1;
      },
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      {/* CssBaseline: consistent browser defaults and the theme's background colour */}
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <NotificationProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </NotificationProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
