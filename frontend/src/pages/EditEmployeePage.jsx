// Edit employee form — built in a later phase.
import { Paper, Typography } from '@mui/material';

function EditEmployeePage() {
  return (
    <Paper sx={{ p: { xs: 2, sm: 4 } }}>
      <Typography variant="h1">Edit Employee</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        The edit form will appear here.
      </Typography>
    </Paper>
  );
}

export default EditEmployeePage;
