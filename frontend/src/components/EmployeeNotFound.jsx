// Shown when an employee can't be opened: it doesn't exist (404), belongs to another
// user (403), or the id in the URL isn't even a valid id (400).
// We show ONE message for all three, so the page doesn't reveal whether someone
// else's employee exists.
import { Link as RouterLink } from 'react-router-dom';
import { Button } from '@mui/material';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import { EmptyState } from './StatusViews';

function EmployeeNotFound() {
  return (
    <EmptyState
      icon={<PersonOffIcon />}
      title="Employee not found"
      titleComponent="h1"
      message="This employee doesn't exist or you don't have access to it."
      action={
        <Button variant="contained" component={RouterLink} to="/employees">
          Back to employees
        </Button>
      }
    />
  );
}

export default EmployeeNotFound;
