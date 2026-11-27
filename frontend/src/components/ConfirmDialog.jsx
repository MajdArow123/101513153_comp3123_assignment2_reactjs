// A yes/no dialog used before destructive actions (deleting an employee).
// While `loading` is true both buttons are disabled, so the request can't be sent twice.
import { useRef } from 'react';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', loading = false, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  return (
    <Dialog
      open={open}
      // Don't let a click outside / Escape close it halfway through the request.
      onClose={loading ? undefined : onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      // Put keyboard focus on Cancel once the dialog has opened, so pressing Enter by
      // accident does NOT delete. (A plain autoFocus runs before the dialog's own focus
      // handling, which then moves focus to the dialog box itself.)
      slotProps={{ transition: { onEntered: () => cancelRef.current?.focus() } }}
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button ref={cancelRef} onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Deleting…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;
