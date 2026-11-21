// App-wide toast messages ("Employee saved", "Could not delete...").
// Any component calls notify(message, severity) and one MUI Snackbar shows it.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // severity: 'success' | 'info' | 'warning' | 'error'
  const notify = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity });
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return; // a click elsewhere on the page shouldn't hide it
    setToast((current) => ({ ...current, open: false }));
  };

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {/* Alert has role="alert", so screen readers announce the message. */}
        <Alert onClose={handleClose} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

// oxlint-disable-next-line react/only-export-components
export function useNotify() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotify must be used inside <NotificationProvider>');
  return context.notify;
}
