// Add employee form — built in a later phase.
import { Paper, Typography } from '@mui/material';

function AddEmployeePage() {
  return (
    <Paper sx={{ p: { xs: 2, sm: 4 } }}>
      <Typography variant="h1">Add Employee</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        The new employee form will appear here.
      </Typography>
    </Paper>
  );
}

export default AddEmployeePage;
