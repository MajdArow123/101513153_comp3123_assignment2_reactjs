// Employee list (table, search) — built in the next phases.
import { Paper, Typography } from '@mui/material';

function EmployeeListPage() {
  return (
    <Paper sx={{ p: { xs: 2, sm: 4 } }}>
      <Typography variant="h1">Employees</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        Your employees will be listed here.
      </Typography>
    </Paper>
  );
}

export default EmployeeListPage;
