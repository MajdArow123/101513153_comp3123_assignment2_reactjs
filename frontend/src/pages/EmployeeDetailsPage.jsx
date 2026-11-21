// Employee details — built in a later phase.
import { Paper, Typography } from '@mui/material';

function EmployeeDetailsPage() {
  return (
    <Paper sx={{ p: { xs: 2, sm: 4 } }}>
      <Typography variant="h1">Employee Details</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        The employee's details will appear here.
      </Typography>
    </Paper>
  );
}

export default EmployeeDetailsPage;
